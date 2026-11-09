import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  Dimensions,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ipAddress } from '../../IpPublic';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, SHADOWS } from '../constants/theme';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

export default function ChangePasswordScreen({ navigation }: { navigation: any }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Semua field harus diisi');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Password baru dan konfirmasi password tidak cocok');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password baru minimal 6 karakter');
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('user_token');

      if (!token) {
        Alert.alert('Error', 'Token tidak ditemukan. Silakan login kembali');
        setLoading(false);
        return;
      }

      const response = await fetch(`${ipAddress}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Berhasil', 'Password berhasil diubah', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Error', data.message || 'Gagal mengubah password');
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan. Silakan coba lagi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header with SVG */}
      <View style={styles.headerBg}>
        <Svg height={180} width={width} viewBox={`0 0 ${width} 180`}>
          <Defs>
            <SvgGradient id="headerGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={COLORS.gradientPrimary[0]} />
              <Stop offset="1" stopColor={COLORS.gradientPrimary[1]} />
            </SvgGradient>
          </Defs>
          <Path d={`M0 0 H${width} V130 Q${width / 2} 170 0 130 Z`} fill="url(#headerGrad)" />
        </Svg>

        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ubah Password</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.iconHeader}>
            <View style={styles.iconBg}>
              <Ionicons name="lock-closed" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Keamanan Akun</Text>
            <Text style={styles.cardSubtitle}>Ubah password Anda secara berkala untuk keamanan</Text>
          </View>

          {/* Old Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password Lama</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan password lama"
                placeholderTextColor="#cbd5e1"
                secureTextEntry={!showOldPassword}
                value={oldPassword}
                onChangeText={setOldPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)} style={styles.eyeIcon}>
                <Ionicons name={showOldPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password Baru</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="key-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan password baru"
                placeholderTextColor="#cbd5e1"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                <Ionicons name={showNewPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Konfirmasi Password Baru</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Konfirmasi password baru"
                placeholderTextColor="#cbd5e1"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>Password minimal 6 karakter</Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButtonContainer}
            onPress={handleChangePassword}
            disabled={loading}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={loading ? ['#94a3b8', '#94a3b8'] : COLORS.gradientPrimary}
              style={styles.submitButton}
            >
              {loading ? (
                <Ionicons name="hourglass-outline" size={20} color="white" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Ubah Password</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#86efac' },
  headerBg: { position: 'relative', height: 180 },
  headerContent: {
    position: 'absolute',
    top: StatusBar.currentHeight! + 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, color: 'white', fontWeight: '700' },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.large,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1e293b',
  },
  eyeIcon: {
    padding: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 13,
    color: '#1e293b',
    marginLeft: 8,
    flex: 1,
  },
  submitButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  submitButton: {
    flexDirection: 'row',
    padding: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
