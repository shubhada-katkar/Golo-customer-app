import React, { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { NavigationContainer, DefaultTheme, getStateFromPath, createNavigationContainerRef } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import { ThemeProvider } from "./theme/ThemeContext";
import Login from './screens/Login';
import Registration from './screens/Registration';
import ForgotPassword from './screens/ForgotPassword';
import JahiratiCategory from './screens/JahiratiCategory';
import CalendarScreen from './screens/CalendarScreen';
import Template from './screens/Template';
import ChatPage from './screens/ChatPage';
import Fav from './screens/Fav';
import ProfilePage from './screens/ProfilePage';
import ChojaHome from './screens/ChojaHome';
import AuthLoading from './screens/AuthLoading';
import FormPage from './screens/FormPage';
import Preview from './screens/Preview';
import Payment from './screens/Payment';
import ChatScreen from './screens/ChatScreen';
import GoloHome from './screens/GoloHome';
import GoloDeals from './screens/GoloDeals';
import GoloFav from './screens/GoloFav';
import OfferDetails from './screens/OfferDetails';
import Claimed from './screens/Claimed';
import AdDetails from './screens/AdDetails';
import ProductDetail from './screens/ProductDetail';
import Analytics from './screens/Analytics';
import Transaction from './screens/Transaction';
import AdAnalytics from "./screens/AdAnalytics";
import AdEdit from "./screens/AdEdit";
import SellerProfile from "./screens/SellerProfile";
import TransactionDetails from "./screens/TransactionDetails";
import FilterPage from "./screens/FilterPage";
import ReviewsPage from "./screens/ReviewsPage";
import ResetPassword from "./screens/ResetPassword";
import { BASE_URL } from "./config"; // adjust path as needed
import NotificationsPage from "./screens/NotificationsPage";
import StorePage from "./screens/StorePage";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import Support from "./screens/Support";
import NoNetPage from "./screens/NoNetPage";
import NetInfo from "@react-native-community/netinfo";
import RatingsBox from "./components/RatingsBox";

import { startCustomerNotificationPolling, stopCustomerNotificationPolling, registerCustomerPushToken } from "./services/notificationService";

SplashScreen.preventAutoHideAsync();

export const navigationRef = createNavigationContainerRef();

const Stack = createStackNavigator();

const SHARE_WEB_BASE = BASE_URL.replace(/\/+$/, "");
const WEBSITE_BASE = SHARE_WEB_BASE.replace("api.", "");

const linking = {
  prefixes: [
    "golo://",
    "https://golo-frontend-inky.vercel.app",
    "http://golo-frontend-inky.vercel.app",
    ...(SHARE_WEB_BASE ? [SHARE_WEB_BASE] : []),
    ...(WEBSITE_BASE ? [WEBSITE_BASE] : []),
  ],
  config: {
    screens: {
      AdDetails: "ad/:adId",
      OfferDetails: "offer/:offerId",
      ProductDetail: "product/:productId/:offerId?",
    },
  },
  getStateFromPath(path, options) {
    const cleanPath = path.replace(/^\/+/, "");
    if (cleanPath.includes("nearby-deals/product")) {
      const urlParts = cleanPath.split("?");
      const queryString = urlParts[1] || "";
      const params = {};
      queryString.split("&").forEach((param) => {
        const [key, val] = param.split("=");
        if (key) {
          params[key] = decodeURIComponent(val || "");
        }
      });
      const productId = params.id || params.productId;
      const offerId = params.offerId;
      if (productId) {
        const newPath = offerId ? `product/${productId}/${offerId}` : `product/${productId}`;
        return getStateFromPath(newPath, options);
      }
    }
    if (cleanPath.includes("nearby-deals/deal")) {
      const urlParts = cleanPath.split("?");
      const queryString = urlParts[1] || "";
      const params = {};
      queryString.split("&").forEach((param) => {
        const [key, val] = param.split("=");
        if (key) {
          params[key] = decodeURIComponent(val || "");
        }
      });
      const offerId = params.offerId;
      if (offerId) {
        return getStateFromPath(`offer/${offerId}`, options);
      }
    }
    if (cleanPath.startsWith("product/") && !cleanPath.includes("nearby-deals/product")) {
      const remainingPath = cleanPath.substring("product/".length);
      if (remainingPath) {
        return getStateFromPath(`ad/${remainingPath}`, options);
      }
    }
    return getStateFromPath(path, options);
  },
};

export default function App() {

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const isOffline = state.isConnected === false || (state.isConnected === true && state.isInternetReachable === false);
      if (isOffline && navigationRef.isReady()) {
        const currentRoute = navigationRef.getCurrentRoute()?.name;
        if (currentRoute && currentRoute !== "NoNetPage") {
          navigationRef.navigate("NoNetPage");
        }
      }
    });

    startCustomerNotificationPolling();
    void registerCustomerPushToken();

    let lastHandledResponseId = null;

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const responseId = response?.notification?.request?.identifier;
      const actionId = response?.actionIdentifier;

      // Only navigate if the user EXPLICITLY clicked the push notification
      if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER && responseId && responseId !== lastHandledResponseId) {
        lastHandledResponseId = responseId;
        const data = response?.notification?.request?.content?.data;
        if (navigationRef.isReady() && data) {
          if (data?.offerId) {
            navigationRef.navigate("OfferDetails", { offerId: data.offerId });
          } else if (data?.conversationId) {
            navigationRef.navigate("ChatScreen", {
              conversationId: data.conversationId,
              sellerName: data.sellerName || "Chat",
            });
          } else if (data?.screen === "NotificationsPage") {
            navigationRef.navigate("NotificationsPage");
          }
        }
      }
    });

    return () => {
      unsubscribeNetInfo();
      stopCustomerNotificationPolling();
      responseSubscription.remove();
    };
  }, []);

  // ⚠️ Must return null while fonts are loading
  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <NavigationContainer ref={navigationRef} linking={linking} theme={DefaultTheme}>
        <Stack.Navigator
          initialRouteName="AuthLoading"
          screenOptions={{
            headerShown: false,
            animationEnabled: false,
            cardStyleInterpolator: CardStyleInterpolators.forNoAnimation,
          }}
        >
          <Stack.Screen name="JahiratiCategory" component={JahiratiCategory} />
          <Stack.Screen name="CalendarScreen" component={CalendarScreen} />
          <Stack.Screen name="Template" component={Template} />
          <Stack.Screen name='Fav' component={Fav} />
          <Stack.Screen name='ChatPage' component={ChatPage} />
          <Stack.Screen name='ProfilePage' component={ProfilePage} />
          <Stack.Screen name='ChojaHome' component={ChojaHome} />
          <Stack.Screen name='Login' component={Login} />
          <Stack.Screen name='Registration' component={Registration} />
          <Stack.Screen name='ForgotPassword' component={ForgotPassword} />
          <Stack.Screen name='AuthLoading' component={AuthLoading} />
          <Stack.Screen name='FormPage' component={FormPage} />
          <Stack.Screen name='Preview' component={Preview} />
          <Stack.Screen name='Payment' component={Payment} />
          <Stack.Screen name='ChatScreen' component={ChatScreen} />
          <Stack.Screen name='GoloHome' component={GoloHome} />
          <Stack.Screen name='GoloDeals' component={GoloDeals} />
          <Stack.Screen name='GoloFav' component={GoloFav} />
          <Stack.Screen name="OfferDetails" component={OfferDetails} />
          <Stack.Screen name="ProductDetail" component={ProductDetail} />
          <Stack.Screen name="Claimed" component={Claimed} />
          <Stack.Screen name="AdDetails" component={AdDetails} />
          <Stack.Screen name="Analytics" component={Analytics} />
          <Stack.Screen name="Transaction" component={Transaction} />
          <Stack.Screen name="AdAnalytics" component={AdAnalytics} />
          <Stack.Screen name="AdEdit" component={AdEdit} />
          <Stack.Screen name="SellerProfile" component={SellerProfile} />
          <Stack.Screen name="TransactionDetails" component={TransactionDetails} />
          <Stack.Screen name="FilterPage" component={FilterPage} />
          <Stack.Screen name="ReviewsPage" component={ReviewsPage} />
          <Stack.Screen name="NotificationsPage" component={NotificationsPage} />
          <Stack.Screen name="StorePage" component={StorePage} />
          <Stack.Screen name="ResetPassword" component={ResetPassword} />
          <Stack.Screen name="Support" component={Support} />
          <Stack.Screen name="NoNetPage" component={NoNetPage} />
        </Stack.Navigator>
      </NavigationContainer>
      <RatingsBox intervalMinutes={20} />
    </ThemeProvider>
  );
}