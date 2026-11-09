import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { Input } from 'react-native-elements';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { ipAddress } from './IpPublic';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types/navigation';

type RegisterNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen = ({ navigation }: { navigation: RegisterNavigationProp }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  // State untuk error
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const handleRegister = async () => {
    setLoading(true);

    setErrors({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
    });

    if (password !== passwordConfirmation) {
      setLoading(false);
      setErrors(prev => ({
        ...prev,
        password_confirmation: 'Password confirmation does not match.',
      }));
      return;
    }

    try {
      const response = await fetch(`${ipAddress}/register`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Berhasil', 'Registrasi berhasil, silakan login.', [
          { text: 'OK', onPress: () => navigation.replace('Login') },
        ]);
      } else {
        if (data.errors) {
          const newErrors = { ...errors };

          if (data.errors.name) {
            newErrors.name = data.errors.name[0];
          }

          if (data.errors.email) {
            newErrors.email = data.errors.email[0];
          }

          if (data.errors.password) {
            newErrors.password = data.errors.password[0];
          }

          if (data.errors.password_confirmation) {
            newErrors.password_confirmation =
              data.errors.password_confirmation[0];
          }

          setErrors(newErrors);
        } else {
          Alert.alert(
            'Registration Failed',
            data.message || 'Something went wrong',
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', `An error occurred: ${error}`);
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
        <Text style={styles.title}>Create Account</Text>

        <Input
          placeholder="Full Name"
          leftIcon={<Ionicons name="person-outline" size={22} color="white" />}
          value={name}
          onChangeText={setName}
          inputStyle={styles.inputStyle}
          containerStyle={styles.inputContainer}
        />
        {errors.name ? (
          <Text style={styles.errorText}>{errors.name}</Text>
        ) : null}

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
        {errors.email ? (
          <Text style={styles.errorText}>{errors.email}</Text>
        ) : null}

        <Input
          placeholder="Password"
          leftIcon={<Ionicons name="lock-closed-outline" size={22} color="white" />}
          value={password}
          onChangeText={setPassword}
          inputStyle={styles.inputStyle}
          secureTextEntry
          containerStyle={styles.inputContainer}
        />
        {errors.password ? (
          <Text style={styles.errorText}>{errors.password}</Text>
        ) : null}

        <Input
          placeholder="Confirm Password"
          leftIcon={<Ionicons name="lock-closed-outline" size={22} color="white" />}
          value={passwordConfirmation}
          onChangeText={setPasswordConfirmation}
          inputStyle={styles.inputStyle}
          secureTextEntry
          containerStyle={styles.inputContainer}
        />
        {errors.password_confirmation ? (
          <Text style={styles.errorText}>{errors.password_confirmation}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.textRegisterButton}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
            let rootNav: any = navigation;
            while (rootNav && typeof rootNav.getParent === 'function' && rootNav.getParent()) {
              rootNav = rootNav.getParent();
            }
            if (rootNav && typeof rootNav.navigate === 'function') {
              rootNav.navigate('Login');
            } else {
              navigation.navigate('Login');
            }
          }}>
          <Text style={styles.loginText}>Already have an account? Login</Text>
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
  registerButton: {
    alignItems: 'center',
    backgroundColor: '#FFF8D4',
    borderRadius: 10,
    paddingVertical: 12,
  },
  textRegisterButton: {
    color: '#313647',
    fontWeight: 'bold',
    fontSize: 15,
  },
  loginText: {
    textAlign: 'center',
    marginTop: 10,
    color: 'white',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 15,
  },
});

export default RegisterScreen;