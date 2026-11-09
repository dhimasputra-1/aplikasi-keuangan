import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

interface Props {
  navigation: WelcomeScreenNavigationProp;
}

const WelcomeScreen = ({ navigation }: Props) => {
  return (
    <LinearGradient colors={['#313647', '#435663']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="lock-closed" size={80} color="#FFF8D4" />
          <Text style={styles.title}>Selamat Datang</Text>
          <Text style={styles.subtitle}>Silakan pilih untuk melanjutkan</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => {
              let rootNav: any = navigation;
              while (rootNav && typeof rootNav.getParent === 'function' && rootNav.getParent()) {
                rootNav = rootNav.getParent();
              }
              if (rootNav && typeof rootNav.navigate === 'function') {
                rootNav.navigate('Login');
              } else {
                navigation.navigate('Login');
              }
            }}
          >
            <Ionicons name="log-in" size={24} color="#313647" />
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Ionicons name="person-add" size={24} color="#FFF8D4" />
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF90',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 15,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8D4',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 10,
  },
  loginButtonText: {
    color: '#313647',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFF8D4',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 10,
  },
  signUpButtonText: {
    color: '#FFF8D4',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WelcomeScreen;

