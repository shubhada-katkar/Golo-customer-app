import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BASE_URL } from '../config';
import Topbar from '../components/Topbar';
import GoloBottom from '../components/GoloBottom';
import { textPresets } from '../theme/typography';

const REVIEW_TRUNCATE_LENGTH = 100;
const PAGE_SIZE = 10;

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StarRow({ rating, size = 14, color = '#fbbf24', emptyColor = '#d1d5db' }) {
    return (
        <View style={{ flexDirection: 'row', gap: 2 }}>
            {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons
                    key={i}
                    name={i < Math.round(rating) ? 'star' : 'star-outline'}
                    size={size}
                    color={i < Math.round(rating) ? color : emptyColor}
                />
            ))}
        </View>
    );
}

function RatingBar({ label, count, total }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <View style={styles.barRow}>
            <Text style={styles.barLabel}>{label}★</Text>
            <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.barCount}>{count}</Text>
        </View>
    );
}

// ─── main component ─────────────────────────────────────────────────────────

export default function ReviewsPage({ route, navigation }) {
    const { offerId, merchant, offerImage } = route?.params || {};

    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);          // { totalReviews, averageRating, breakdown }
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState(null);
    const [expandedReviews, setExpandedReviews] = useState({});

    // ── fetch ──────────────────────────────────────────────────────────────

    const fetchReviews = useCallback(async (pageNum = 1, append = false) => {
        if (!offerId) {
            setError('No offer selected.');
            setLoading(false);
            return;
        }

        try {
            const url = `${BASE_URL}/reviews/offers/${offerId}?page=${pageNum}&limit=${PAGE_SIZE}`;
            const res = await fetch(url);
            const json = await res.json();

            if (!res.ok || !json?.success) {
                throw new Error(json?.message || 'Failed to load reviews');
            }

            const incoming = json?.data?.reviews || [];
            const pagination = json?.pagination || {};

            setReviews(prev => append ? [...prev, ...incoming] : incoming);
            setStats(json?.data?.stats || null);
            setHasMore(pageNum < (pagination.totalPages || 1));
            setPage(pageNum);
            setError(null);
        } catch (err) {
            setError(err?.message || 'Something went wrong');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [offerId]);

    useEffect(() => {
        setLoading(true);
        fetchReviews(1, false);
    }, [fetchReviews]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchReviews(1, false);
    };

    const handleLoadMore = () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        fetchReviews(page + 1, true);
    };

    const toggleExpand = (id) => {
        setExpandedReviews(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // ── render helpers ─────────────────────────────────────────────────────

    const renderStats = () => {
        if (!stats) return null;
        const { totalReviews, averageRating, breakdown } = stats;

        return (
            <View style={styles.statsCard}>
                {/* left: big average */}
                <View style={styles.statsLeft}>
                    <Text style={styles.avgNumber}>{Number(averageRating).toFixed(1)}</Text>
                    <StarRow rating={averageRating} size={18} />
                    <Text style={styles.totalText}>{totalReviews} review{totalReviews !== 1 ? 's' : ''}</Text>
                </View>

                {/* right: bar breakdown */}
                <View style={styles.statsRight}>
                    {[5, 4, 3, 2, 1].map(star => (
                        <RatingBar
                            key={star}
                            label={star}
                            count={breakdown?.[star] || 0}
                            total={totalReviews}
                        />
                    ))}
                </View>
            </View>
        );
    };

    const renderReview = (review) => {
        const isLong = (review.content || '').length > REVIEW_TRUNCATE_LENGTH;
        const isExpanded = expandedReviews[review._id];
        const displayText = isLong && !isExpanded
            ? review.content.slice(0, REVIEW_TRUNCATE_LENGTH).trim() + '... '
            : (review.content || '') + ' ';

        // initials avatar
        const initials = (review.userName || 'C')
            .split(' ')
            .map(w => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

        return (
            <View key={review._id} style={styles.reviewCard}>
                {/* top row */}
                <View style={styles.reviewTop}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.reviewerName}>{review.userName || 'Customer'}</Text>
                        <StarRow rating={review.rating} size={13} />
                    </View>
                    <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
                </View>

                {/* comment */}
                <Text style={styles.reviewComment}>
                    {displayText}
                    {isLong && (
                        <Text style={styles.readMore} onPress={() => toggleExpand(review._id)}>
                            {isExpanded ? 'show less' : 'read more'}
                        </Text>
                    )}
                </Text>
            </View>
        );
    };

    // ── main render ────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
            <LinearGradient
                colors={['#f8a812', '#fad081', '#f8f6f265']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ height: 220, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0 }}
            />
            <Topbar />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back-ios" size={22} color="#000" style={{ padding: 10 }} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reviews</Text>
            </View>

            <View style={{ height: 1, backgroundColor: '#000000', marginTop: 2 }} />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#f8a812']} />
                }
            >

                {/* Shop Card */}
                <View style={styles.shopCard}>
                    {offerImage ? (
                        <Image source={{ uri: offerImage }} style={styles.shopImage} />
                    ) : (
                        <View style={[styles.shopImage, styles.shopImagePlaceholder]}>
                            <Ionicons name="storefront-outline" size={36} color="#bbb" />
                        </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={styles.shopName}>{merchant || 'Store'}</Text>
                    </View>
                </View>

                <Text style={styles.shopSub}>Customer Reviews</Text>

                {/* Loading skeleton */}
                {loading && (
                    <View style={styles.centeredBox}>
                        <ActivityIndicator size="large" color="#f8a812" />
                        <Text style={styles.loadingText}>Loading reviews…</Text>
                    </View>
                )}

                {/* Error */}
                {!loading && error && (
                    <View style={styles.centeredBox}>
                        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchReviews(1, false)}>
                            <Text style={styles.retryText}>Try again</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Content */}
                {!loading && !error && (
                    <>
                        {renderStats()}

                        {reviews.length === 0 ? (
                            <View style={styles.emptyBox}>
                                <Ionicons name="chatbubble-outline" size={52} color="#ccc" />
                                <Text style={styles.emptyTitle}>No reviews yet</Text>
                                <Text style={styles.emptySubtitle}>
                                    Be the first to leave a review after redeeming your voucher!
                                </Text>
                            </View>
                        ) : (
                            reviews.map(renderReview)
                        )}

                        {/* Load more */}
                        {hasMore && (
                            <TouchableOpacity
                                style={styles.loadMoreBtn}
                                onPress={handleLoadMore}
                                disabled={loadingMore}
                            >
                                {loadingMore
                                    ? <ActivityIndicator size="small" color="#f8a812" />
                                    : <Text style={styles.loadMoreText}>Load more</Text>
                                }
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </ScrollView>
            <SafeAreaView
                edges={["bottom"]}
                style={{ position: "absolute", bottom: 0, width: "100%" }}
            >
                <GoloBottom />
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 6,
    },
    headerTitle: {
        ...textPresets.title
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 50,
    },

    // ── shop card ──────────────────────────────────────────────────────────
    shopCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 14,
    },
    shopImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: "#157a4f"
    },
    shopImagePlaceholder: {
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shopName: {
        ...textPresets.subtitle,
        color: '#111',
    },
    shopSub: {
        ...textPresets.body,
        color: '#888',
        paddingVertical: 10,
        lineHeight: Math.round(14 * 1.5),
    },

    // ── stats card ─────────────────────────────────────────────────────────
    statsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    statsLeft: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        width: 72,
        alignSelf: 'center'
    },
    avgNumber: {
        color: '#111',
        ...textPresets.title
    },
    totalText: {
        color: '#888',
        marginTop: 4,
        textAlign: 'center',
        ...textPresets.label
    },
    statsRight: {
        flex: 1,
        justifyContent: 'center',
        gap: 5,
        marginTop: 6
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
    },
    barLabel: {
        color: '#555',
        width: 18,
        textAlign: 'right',
        ...textPresets.caption
    },
    barTrack: {
        flex: 1,
        height: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: '#fbbf24',
        borderRadius: 4,
    },
    barCount: {
        color: '#888',
        width: 20,
        textAlign: 'right',
        ...textPresets.label
    },

    // ── review card ────────────────────────────────────────────────────────
    reviewCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    reviewTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        ...textPresets.body,
        color: '#2e7d32',
        lineHeight: Math.round(14 * 1.5)
    },
    reviewerName: {
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
        color: '#111',
    },
    reviewDate: {
        color: '#aaa',
        ...textPresets.label
    },
    reviewComment: {
        color: '#444',
        ...textPresets.label
    },
    readMore: {
        color: '#f8a812',
        ...textPresets.label

    },

    // ── states ─────────────────────────────────────────────────────────────
    centeredBox: {
        alignItems: 'center',
        paddingVertical: 48,
        gap: 12,
    },
    loadingText: {
        color: '#888',
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5)
    },
    errorText: {
        color: '#e74c3c',
        textAlign: 'center',
        paddingHorizontal: 24,
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5)
    },
    retryBtn: {
        marginTop: 4,
        backgroundColor: '#f8a812',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 10,
    },
    retryText: {
        color: '#fff',
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5)
    },
    emptyBox: {
        alignItems: 'center',
        paddingVertical: 48,
        gap: 10,
    },
    emptyTitle: {
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
        color: '#555',
    },
    emptySubtitle: {
        ...textPresets.caption,
        textAlign: 'center',
        paddingHorizontal: 32,
    },

    // ── load more ──────────────────────────────────────────────────────────
    loadMoreBtn: {
        alignItems: 'center',
        paddingVertical: 14,
        marginTop: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f8a812',
    },
    loadMoreText: {
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
        color: '#f8a812',
    },
});