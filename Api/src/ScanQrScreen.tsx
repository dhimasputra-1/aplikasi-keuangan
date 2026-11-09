import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner, useCameraPermission } from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from './constants/theme';
import LinearGradient from 'react-native-linear-gradient';

export default function ScanQrScreen({ navigation }: { navigation: any }) {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isActive, setIsActive] = useState(false);
  const [torch, setTorch] = useState<'off' | 'on'>('off');

  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      return () => {
        setIsActive(false);
      };
    }, [])
  );

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes) => {
      if (codes.length > 0) {
        // Stop scanning immediately when code found
        setIsActive(false);
        const value = codes[0].value;
        if (value) {
          Alert.alert('QR Code Terdeteksi', `Isi: ${value}`, [
            {
              text: 'Kirim Uang',
              onPress: () => {
                // Navigate to KirimUang with data
                // We use nested navigation to ensure it works even if called from the Tab Bar
                navigation.navigate('Home', {
                  screen: 'KirimUang',
                  params: { scannedData: value }
                });
              }
            },
            {
              text: 'Scan Lagi',
              onPress: () => setIsActive(true)
            }
          ]);
        }
      }
    },
  });

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Minta izin akses kamera...</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Kamera tidak ditemukan pada perangkat ini.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        codeScanner={codeScanner}
        torch={torch}
      />

      {/* Overlay UI */}
      <View style={styles.overlay}>
        <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Scan QR</Text>
          <TouchableOpacity onPress={() => setTorch(t => t === 'off' ? 'on' : 'off')} style={styles.torchButton}>
            <Ionicons name={torch === 'on' ? "flash" : "flash-off"} size={24} color="white" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.scanAreaWrapper}>
          <View style={styles.scanArea} />
          <Text style={styles.hintText}>Arahkan kamera ke QR Code</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  text: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  torchButton: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  scanAreaWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: 20,
    backgroundColor: 'transparent',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  hintText: {
    color: 'white',
    marginTop: 20,
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
  }
});