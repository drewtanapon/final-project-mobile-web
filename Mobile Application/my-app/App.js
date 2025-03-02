import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "./LoginScreen"; 
import RegisterScreen from "./RegisterScreen";
import HomeScreen from "./HomeScreen";
import OTPScreen from "./OTPScreen";
import LinkPhoneScreen from "./LinkEmailAndPhone";  
import ShowClassScreen from "./ShowClassScreen";
import JoinClassScreen from "./JoinClass";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="OTPLogin" component={OTPScreen}/>
        <Stack.Screen name="LinkEmailAndPhone" component={LinkPhoneScreen}/>
        <Stack.Screen name="ShowClass" component={ShowClassScreen} />
        <Stack.Screen name="JoinClass" component={JoinClassScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
