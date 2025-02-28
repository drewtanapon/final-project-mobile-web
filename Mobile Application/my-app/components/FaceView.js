import { useState } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

export default function FaceView() {
  const [facing, setFacing] = useState('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [zoom, setZoom] = useState(0.5);
  
  if (!permission) {
    return <View style={styles.container}><Text>ไม่มีกล้อง</Text></View>;
  }
  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleFace() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  function Zoom(z){
    if(zoom>=0 && z<0) setZoom(zoom+z);
    else if(zoom<=1 && z>0) setZoom(zoom+z);
  }


  return (
    <View style={styles.container}>
      <CameraView
        style={{ height: '100%', width: '100%' }}
        facing={facing}
        zoom={zoom}
      >
        <View style={styles.row}>
          <Button title="สลับกล้อง" onPress={toggleFace} />
          <Button title="ย่อ" onPress={() => Zoom(-0.1)} />
          <Button title="0.1" onPress={() => setZoom(0.1)} />
          <Button title="0.5" onPress={() => setZoom(0.5)} />
          <Button title="0.8" onPress={() => setZoom(0.8)} />
          <Button title="ขยาย" onPress={() => Zoom(0.1)} />
        </View>
        <Text style={styles.facingText}>{facing}</Text>
      </CameraView>      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    padding: 5,
    height: 450,
  },
  row: {
    justifyContent: 'center',
    flexDirection: 'row',
    padding: 4,
    flexWrap: 'wrap',
    gap: 5,
  },
  facingText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
});