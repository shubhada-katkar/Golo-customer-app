import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BASE_URL } from '../config';
import Topbar from '../components/Topbar';
import CustomAlertModal from '../components/CustomeAlertModal';
import { getValidToken } from '../services/authService';
import { fetchOfferDetails } from '../services/offersService';
import { textPresets } from '../theme/typography';

const POLL_INTERVAL_MS = 10000;

function formatRelativeTime(value) {
  if (!value) return 'Just now';

  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPage({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [navigatingOfferId, setNavigatingOfferId] = useState(null);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'warning',
  });

  const markAllAsSeen = async () => {
    try {
      const token = await getValidToken();
      const response = await fetch(`${BASE_URL}/users/notifications/read-all`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to mark notifications as seen');
      }
    } catch (error) {
      console.warn('Failed to mark notifications as seen', error);
    }
  };

  const fetchNotifications = async (showLoader = false, isRefresh = false) => {
    try {
      if (showLoader) setLoading(true);
      if (isRefresh) setRefreshing(true);

      const token = await getValidToken();
      const response = await fetch(`${BASE_URL}/users/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to load notifications');
      }

      const json = await response.json();
      const rawItems = json?.data?.notifications || json?.notifications || (Array.isArray(json?.data) ? json.data : []);
      const items = Array.isArray(rawItems) ? rawItems : [];
      const normalizedItems = items.map((item) => ({ ...item, read: true }));
      setNotifications(normalizedItems);

      if (showLoader) {
        await markAllAsSeen();
      }
    } catch (error) {
      console.warn('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true);

    const intervalId = setInterval(() => {
      fetchNotifications(false);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const isOfferExpired = (offer) => {
    if (!offer) return true;
    if (offer.status === 'expired' || offer.status === 'deleted' || offer.isActive === false) return true;

    if (offer.endDate) {
      const end = new Date(offer.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (end < today) return true;
    }

    if (Array.isArray(offer.selectedDates) && offer.selectedDates.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const validDates = offer.selectedDates.filter((d) => String(d) >= todayStr);
      if (validDates.length === 0) return true;
    }

    return false;
  };

  const handleNotificationPress = async (item) => {
    if (!item) return;

    // Only redirect if this is specifically a new offer notification
    const isNewOfferNotification = item?.type === 'new_offer' || item?.type === 'offer';
    if (!isNewOfferNotification) {
      return;
    }

    const offerId = item?.offerId || item?.adId || item?.requestId || item?.id;
    if (!offerId) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Offer Expired',
        message: 'This offer has expired or is no longer available.',
      });
      return;
    }

    setNavigatingOfferId(offerId);

    try {
      const fetchedOffer = await fetchOfferDetails(offerId);

      if (!fetchedOffer || isOfferExpired(fetchedOffer)) {
        setAlertConfig({
          visible: true,
          type: 'warning',
          title: 'Offer Expired',
          message: 'This offer has expired or is no longer available.',
        });
        return;
      }

      navigation.navigate('OfferDetails', {
        offerId,
        offerData: fetchedOffer,
      });
    } catch (error) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Offer Expired',
        message: 'This offer has expired or is no longer available.',
      });
    } finally {
      setNavigatingOfferId(null);
    }
  };

  const renderItem = ({ item }) => {
    const isAccepted = item?.type === 'order_accepted';
    const isNewOffer = item?.type === 'new_offer';
    const currentOfferId = item?.offerId || item?.adId || item?.requestId || item?.id;
    const isNavigating = navigatingOfferId === currentOfferId;

    const isAdmin =
      !isNewOffer && (
        item?.isAdmin ||
        item?.isBroadcast ||
        ['admin_warning', 'promotional', 'alert', 'emergency', 'system_update', 'admin', 'broadcast'].includes(item?.type) ||
        (item?.senderName && String(item.senderName).toLowerCase().includes('admin')) ||
        (item?.title && (!item?.adTitle || item?.adTitle === '-'))
      );

    let displayTitle = 'New update';
    if (isNewOffer) {
      displayTitle = item?.title || item?.adTitle || (item?.senderName ? `${item.senderName} posted a new offer!` : 'New Offer Posted!');
    } else if (isAdmin) {
      displayTitle = (item?.title && item.title !== '-')
        ? item.title
        : (item?.adTitle && item.adTitle !== '-' ? item.adTitle : (item?.senderName && item.senderName !== '-' ? item.senderName : 'Admin Notification'));
    } else {
      displayTitle = (item?.adTitle && item.adTitle !== '-')
        ? item.adTitle
        : (item?.title && item.title !== '-' ? item.title : 'New update');
    }

    const displayMessage = item?.message || item?.description || item?.body || 'You have a new notification.';

    let iconName = 'notifications-active';
    let iconColor = '#f8a812';
    if (isNewOffer) {
      iconName = 'local-offer';
      iconColor = '#157a4f';
    } else if (isAdmin) {
      iconName = 'campaign';
      iconColor = '#f8a812';
    } else if (isAccepted) {
      iconName = 'check-circle';
      iconColor = '#16a34a';
    }

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleNotificationPress(item)}
        style={[styles.card, !item.read && styles.cardUnread]}
      >
        <View style={styles.iconWrap}>
          {isNavigating ? (
            <ActivityIndicator size="small" color="#157a4f" />
          ) : (
            <MaterialIcons
              name={iconName}
              size={22}
              color={iconColor}
            />
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {displayTitle}
          </Text>
          <Text style={styles.cardMessage} numberOfLines={3}>
            {displayMessage}
          </Text>
          <Text style={styles.cardMeta}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
        {!item.read ? <View style={styles.unreadDot} /> : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#f8a812", "#fad081", "#f8f6f265"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      />
      <Topbar />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back-ios" size={22} color="#000" style={{ padding: 10 }} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        {/* <Text style={styles.headerBadge}>{unreadCount > 0 ? `${unreadCount} new` : 'Live'}</Text> */}
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#f8a812" />
          <Text style={styles.emptyText}>Loading your updates...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(false, true)}
              tintColor="#f8a812"
            />
          }
          ListEmptyComponent={
            <View style={styles.centerState}>
              <MaterialIcons name="notifications-none" size={44} color="#b7b7b7" />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>New merchant updates will appear here instantly.</Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}

      <CustomAlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerGradient: {
    height: 220,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    ...textPresets.title
  },
  headerBadge: {
    ...textPresets.label,
    color: '#8a5a00',
    backgroundColor: '#fff3d6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#f8a812',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff6df',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    ...textPresets.body,
    color: '#111827',
    marginBottom: 4,
    lineHeight: Math.round(14 * 1.5),
  },
  cardMessage: {
    ...textPresets.label,
    color: '#6b7280',
  },
  cardMeta: {
    ...textPresets.caption,
    color: '#9ca3af',
    marginTop: 6,
  },
  unreadDot: {
    width: 10,
    height: 10,
    backgroundColor: '#f8a812',
    borderRadius: 5,
    marginLeft: 8,
    marginTop: 4,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    ...textPresets.body,
    marginTop: 10,
    color: '#111827',
    lineHeight: Math.round(14 * 1.5),
  },
  emptyText: {
    ...textPresets.body,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: Math.round(14 * 1.5),
  },
});