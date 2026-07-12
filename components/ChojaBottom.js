import React from "react";
import { View,Text,StyleSheet,TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, FontAwesome6,FontAwesome, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { ensureAuthenticated } from "../services/authService";

export default function ChojaBottom(){
    const navigation=useNavigation();
    const route = useRoute();
    const currentRoute = route.name;
    const {colors} = useContext(ThemeContext);

    const handleProtectedNavigate = async (screenName) => {
        try {
            await ensureAuthenticated(navigation);
            navigation.navigate(screenName);
        } catch {
            // Login screen is handled by ensureAuthenticated.
        }
    };

    return(
        <View style={[styles.top, {backgroundColor:colors.bottombar}]}>

            <TouchableOpacity style={[styles.bar ]} onPress={()=>navigation.navigate("ChojaHome")}>
                <MaterialCommunityIcons name="view-dashboard-outline" size={24}
                color={currentRoute === "ChojaHome" ? "#f9a641" : "black"}/>
                <Text style={{textAlign:"auto",fontSize:11,color:currentRoute === "ChojaHome" ? "#f9a641":"black",
                    fontFamily : "Medium", lineHeight: Math.round(11*1.5)
                }}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bar} onPress={()=>navigation.navigate("Fav")}>
                <Feather name="heart" size={24}
                color={currentRoute === "Fav" ? "#f9a641" : "black"}/>
                <Text style={{textAlign:"auto",fontSize:11,color:currentRoute === "Fav" ? "#f9a641" : "black",
                    fontFamily : "Medium", lineHeight: Math.round(11*1.5)
                }}>Saved Ads</Text>
            </TouchableOpacity>

           <View style={styles.centerContainer}>
  <TouchableOpacity  onPress={() => handleProtectedNavigate("JahiratiCategory")}
    style={[styles.addButton, 
        {backgroundColor:currentRoute==="JahiratiCategory" ? "#f9a641" :"#4caf50"}
    ]} >
    <MaterialCommunityIcons
      name="plus"
      size={32}
      color={currentRoute==="JahiratiCategory" ? "#ffffff" : "black"}
    />
  </TouchableOpacity>

  <Text
    style={{
      fontSize: 11,
      color: currentRoute === "JahiratiCategory" ? "#f9a641" : "black",
      fontFamily: "Medium",
    }}
  >
    Post AD
  </Text>
</View>

            <TouchableOpacity style={styles.bar} onPress={() => handleProtectedNavigate("ChatPage")}>
                <Feather name="message-circle" size={24}
                color= {currentRoute === "ChatPage" ? "#f9a641" : "black"}/>
                <Text style={{textAlign:"auto",fontSize:11,color:currentRoute === "ChatPage" ? "#f9a641" : "black",
                    fontFamily : "Medium", lineHeight: Math.round(11*1.5)
                }}>Chats</Text>
            </TouchableOpacity>

                <TouchableOpacity style={styles.bar} onPress={() => handleProtectedNavigate("ProfilePage")}>
                <MaterialCommunityIcons name="account-circle-outline" size={24} 
                color={currentRoute === "ProfilePage" ? "#f9a641" : "black"}/>
                <Text style={{textAlign:"auto",fontSize:11,color:currentRoute === "ProfilePage" ? "#f9a641" : "black",
                    fontFamily : "Medium", lineHeight: Math.round(11*1.5)
                }}>Profile</Text>
                </TouchableOpacity>

        </View>
    );
}

const styles=StyleSheet.create({
    top : {
        flexDirection:"row",
        minHeight: 60,
        borderColor:"grey", 
        backgroundColor:"white", 
        borderTopWidth:1, 
        paddingVertical: 8,
        alignItems: "center",
    },
    bar: {
        flex: 1,
        alignItems:"center",
        flexDirection: "column", 
    },
     centerContainer:{
        flexDirection:"column",
        justifyContent:"center",
        alignSelf:"center",
        alignItems:"center",
     },
addButton: {
  width: 60,
  height: 60,
  borderRadius: 30,

  justifyContent: "center",
  alignItems: "center",

  borderWidth: 3,
  borderColor: "#d1d1d1",

  marginTop: -30, // lifts button above bar
},
})