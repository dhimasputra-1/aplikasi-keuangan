import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { Input } from 'react-native-elements';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { ipAddress } from './IpPublic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types/navigation';

type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginForm = ({ navigation }: { navigation: LoginNavigationProp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      console.log('Attempting login to:', `${ipAddress}/login`, { email });
      const response = await fetch(`${ipAddress}/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      console.log('Login response status:', response.status);
      const responseText = await response.text();
      console.log('Login response text:', responseText);

      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.warn('Unable to parse login response as JSON', e);
      }

      if (response.ok && data) {
        const token =
          data.token ??
          data.access_token ??
          data?.data?.token ??
          data?.data?.access_token ??
          data?.user?.token;

        if (!token) {
          throw new Error('Token tidak ditemukan pada respons server.');
        }

        // Simpan token dan data user
        await AsyncStorage.setItem('user_token', token);
        
        // Simpan data user
        const user = data.user || data.data || {};
        const userData = {
          name: user.name || user.username || email.split('@')[0],
          email: user.email || email,
          phone: user.phone || user.telepon || '',
          avatar: user.avatar || user.profile_picture || user.image,
          created_at: user.created_at || user.createdAt,
        };
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        
        navigation.replace('MainApp');
      } else {
        const message = data?.message || responseText || 'Invalid credentials';
        Alert.alert('Login Failed', message);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // Network-level errors or thrown errors
      const isNetwork = error.message && (error.message.includes('Network') || error.message.includes('Failed to fetch'));
      if (isNetwork) {
        Alert.alert('Network Error', 'Tidak dapat terhubung ke server. Periksa koneksi dan IP server.');
      } else {
        Alert.alert('Error', `An error occurred: ${error.message || error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#313647', '#435663']}
      style={styles.gradientBackground}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Silahkan Login</Text>
        <Input
          placeholder="Email"
          leftIcon={<Ionicons name="mail-outline" size={22} color="white" />}
          value={email}
          onChangeText={setEmail}
          inputStyle={styles.inputStyle}
          keyboardType="email-address"
          autoCapitalize="none"
          containerStyle={styles.inputContainer}
        />
        <Input
          placeholder="Password"
          leftIcon={
            <Ionicons name="lock-closed-outline" size={22} color="white" />
          }
          value={password}
          onChangeText={setPassword}
          inputStyle={styles.inputStyle}
          secureTextEntry
          containerStyle={styles.inputContainer}
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.textLoginButton}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>
            Don't have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputStyle: {
    color: 'white',
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: '#FFF8D4',
    borderRadius: 10,
    paddingVertical: 12,
  },
  textLoginButton: {
    color: '#313647',
    fontWeight: 'bold',
    fontSize: 15,
  },

  registerText: {
    textAlign: 'center',
    marginTop: 10,
    color: 'white',
    fontSize: 16,
  },
});

export default LoginForm;