import * as React from 'react';
import { Text, View, StyleSheet, ImageBackground } from 'react-native';
import Constants from 'expo-constants';

// Import components
import FaceView from './components/FaceView';
import { Card } from 'react-native-paper';
import * as Font from 'expo-font';

export default function App() {
  const [fontLoaded, setFontLoaded] = React.useState(false);
  const [fontsLoaded] = Font.useFonts({
    chakapetch: require('./assets/ChakraPetch-Regular.ttf'),
  });

  const bgImage = require('./assets/images.jpg');

  return (
    <ImageBackground source={bgImage} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.paragraph}>Work 5: Animal camera</Text>
        <Card style={styles.card}>
          <FaceView />
        </Card>
        <Text style={[styles.paragraph, { fontSize: 17 }]}>
          653380200-4 นายธนพนธ์ ผาศิริ
        </Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Constants.statusBarHeight,
    width: '100%',
  },
  paragraph: {
    margin: 24,
    fontSize: 27,
    fontWeight: 'bold',
    textAlign: 'bottom',
    fontFamily: 'chakapetch',
    color: '#fff', 
  },
  card: {
    width: '90%',
    padding: 10,
  },
});
