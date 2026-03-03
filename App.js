import React, { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import { ThemeProvider } from "./theme/ThemeContext";
import Login from './screens/Login';
import Registration from './screens/Registration';
import JahiratiCategory from './screens/JahiratiCategory';
import CalendarScreen from './screens/CalendarScreen';
import Template from './screens/Template';
import ChatPage from './screens/ChatPage';
import Fav from './screens/Fav';
import ProfilePage from './screens/ProfilePage';
import ChojaHome from './screens/ChojaHome';
import { useFonts } from "expo-font";
import AuthLoading from './screens/AuthLoading';
import FormPage from './screens/FormPage';
import Preview from './screens/Preview';
import Payment from './screens/Payment';
import ChatScreen from './screens/ChatScreen';
import GoloHome from './screens/GoloHome';
import GoloFav from './screens/GoloFav';
import GoloChatPage from './screens/GoloChatPage';
import OfferDetails from './screens/OfferDetails';
import Claimed from './screens/Claimed';

SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

export default function App() {
  // 🔑 Move useFonts inside the component
  const [fontsLoaded] = useFonts({
    "Italic": require("./assets/fonts/GoogleSans-Italic.ttf"),
    "Bold": require("./assets/fonts/GoogleSans-Bold.ttf"),
    "SemiBold": require("./assets/fonts/GoogleSans-SemiBold.ttf"),
    "Medium": require("./assets/fonts/GoogleSans-Medium.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // ⚠️ Must return null while fonts are loading
  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
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
          <Stack.Screen name='AuthLoading' component={AuthLoading} />
          <Stack.Screen name='FormPage' component={FormPage} />
          <Stack.Screen name='Preview' component={Preview} />
          <Stack.Screen name='Payment' component={Payment} />
          <Stack.Screen name='ChatScreen' component={ChatScreen} />
          <Stack.Screen name='GoloHome' component={GoloHome} />
          <Stack.Screen name='GoloFav' component={GoloFav} />
          <Stack.Screen name='GoloChatPage' component={GoloChatPage} />
          <Stack.Screen name="OfferDetails" component={OfferDetails} />
          <Stack.Screen name="Claimed" component={Claimed} />

        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}