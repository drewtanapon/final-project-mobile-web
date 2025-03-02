import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { auth } from "./firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Asset } from "expo-asset";
import { Image } from "react-native";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in UID:", userCredential.user.uid);
      Alert.alert("Success", `Logged in successfully!`);
      navigation.replace("LinkEmailAndPhone");
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    }
    setLoading(false);
  };

  const handleOTPLogin = () => {
    Alert.alert("Redirect", "Navigating to OTP Login...");
    navigation.navigate("OTPLogin");
  };

  const handleRegister = () => {
    Alert.alert("Redirect", "Navigating to Register Screen...");
    navigation.navigate("Register");
  };

  const image = Asset.fromModule(require("./assets/fish.gif")).uri; 

  return (
      <ImageBackground
        source={{ uri: image }}
        style={styles.background}
        resizeMode="cover"
      >

      <Image source={{ uri: "https://media.tenor.com/-SC7uwUlHqUAAAAj/fish-groove.gif" }} style={{ width: 80, height: 80 }} />


      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={24} color="gray" />
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        
        {/* Password Input */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={24} color="gray" />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
        </TouchableOpacity>

        {/* Login with OTP Button */}
        <TouchableOpacity style={styles.otpButton} onPress={handleOTPLogin}>
          <Text style={styles.buttonText}>Login with OTP</Text>
        </TouchableOpacity>

        {/* Register Button */}
        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}> 
          <Text style={styles.registerText}>Register</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

// Styles
const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  container: {
    width: "90%",
    padding: 20,
    backgroundColor: "rgba(196, 220, 220, 0.54)", // ทำให้พื้นหลังจางลงเพื่อให้อ่านง่าย
    borderRadius: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 15,
    elevation: 3,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: "#007bff",
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 10,
    elevation: 3,
  },
  otpButton: {
    backgroundColor: "#28a745",
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 10,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  registerButton: {
    marginTop: 15,
  },
  registerText: {
    fontSize: 16,
    color: "#007bff",
  },
});

export default LoginScreen;
