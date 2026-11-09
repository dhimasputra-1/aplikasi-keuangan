import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ipAddress, ipsaja } from '../../IpPublic';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SHADOWS } from '../constants/theme';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const defaultAvatar = require('../../../assets/images/gunung1.jpg');

type UserStackParamList = {
  UserScreen: undefined;
  ChangePasswordScreen: undefined;
  FormGantiFoto: undefined;
};

type UserScreenNavProp = NativeStackNavigationProp<UserStackParamList, 'UserScreen'>;

interface UserData {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  created_at?: string;
}

export default function UserScreen() {
  const navigation = useNavigation<UserScreenNavProp>();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const fetchUserProfile = React.useCallback(async () => {
    const token = await AsyncStorage.getItem('user_token');
    if (!token) {
      const rootNav = (navigation as any).getParent ? (navigation as any).getParent() : navigation;
      if (rootNav && typeof rootNav.replace === 'function') {
        rootNav.replace('Login');
      }
      return;
    }
    try {
      const response = await fetch(`${ipAddress}/data-pengguna`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUserData(data.user);

        try {
          const uid = data.user?.id || data.user?.email || data.user?.name || null;
          let perOverride: string | null = null;
          if (uid) {
            perOverride = await AsyncStorage.getItem(`uploaded_avatar_${uid}`);
          }
          const legacyOverride = await AsyncStorage.getItem('uploaded_avatar');

          if (data.user?.avatar) {
            setAvatarUri(`${ipsaja.replace('/api', '')}${data.user.avatar}?t=${Date.now()}`);
            await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
          } else if (perOverride || legacyOverride) {
            const chosen = perOverride || legacyOverride;
            if (chosen) {
              const uri = chosen.startsWith('http') ? chosen : `${ipsaja.replace('/api', '')}${chosen}`;
              setAvatarUri(`${uri}?t=${Date.now()}`);
              const merged = { ...data.user, avatar: chosen };
              await AsyncStorage.setItem('user_data', JSON.stringify(merged));
            }
          } else {
            setAvatarUri(null);
            await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
          }
        } catch (e) {
          console.warn('Error merging cached user_data:', e);
          if (data.user?.avatar) {
            setAvatarUri(`${ipsaja.replace('/api', '')}${data.user.avatar}?t=${Date.now()}`);
          } else {
            setAvatarUri(null);
          }
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch user data');
      }
    } catch (error) {
      Alert.alert('Error', `An error occurred: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        try {
          const stored = await AsyncStorage.getItem('user_data');
          let override: string | null = null;
          if (stored) {
            const parsed = JSON.parse(stored);
            const uid = parsed?.id || parsed?.email || parsed?.name || null;
            if (uid) {
              const key = `uploaded_avatar_${uid}`;
              const v = await AsyncStorage.getItem(key);
              if (v) override = v;
            }
          }

          if (!override) override = await AsyncStorage.getItem('uploaded_avatar');

          if (override) {
            const uri = override.startsWith('http')
              ? override
              : `${ipsaja.replace('/api', '')}${override}`;
            setAvatarUri(`${uri}?t=${Date.now()}`);
          } else {
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed.avatar) {
                const uri = parsed.avatar.startsWith('http')
                  ? parsed.avatar
                  : `${ipsaja.replace('/api', '')}${parsed.avatar}`;
                setAvatarUri(`${uri}?t=${Date.now()}`);
              } else {
                setAvatarUri(null);
              }
            }
          }
        } catch (e) {
          console.warn('Failed to read cached user_data/on-focus override', e);
        }

        await fetchUserProfile();
      })();
    }, [fetchUserProfile])
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Apakah Anda yakin ingin logout?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('user_token');
          await AsyncStorage.removeItem('user_data');

          const rootNavigation = navigation.getParent()?.getParent();
          if (rootNavigation) {
            rootNavigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Memuat profil...</Text>
      </View>
    );
  }

  const defaultAvatar = require('../../../assets/images/save-money_6475889.png');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header with SVG */}
      <View style={styles.headerBg}>
        <Svg height={280} width={width} viewBox={`0 0 ${width} 280`}>
          <Defs>
            <SvgGradient id="headerGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={COLORS.gradientPrimary[0]} />
              <Stop offset="1" stopColor={COLORS.gradientPrimary[1]} />
            </SvgGradient>
          </Defs>
          <Path d={`M0 0 H${width} V220 Q${width / 2} 280 0 220 Z`} fill="url(#headerGrad)" />
          <Circle cx={width - 50} cy={50} r={80} fill="rgba(255,255,255,0.1)" />
          <Circle cx={30} cy={150} r={60} fill="rgba(255,255,255,0.05)" />
        </Svg>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('FormGantiFoto')}
            activeOpacity={0.7}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
                defaultSource={defaultAvatar}
              />
            ) : (
              <Image source={defaultAvatar} style={styles.avatar} />
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{userData?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{userData?.email || 'Email tidak tersedia'}</Text>

          {userData?.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color="#64748b" />
              <Text style={styles.infoText}>{userData.phone}</Text>
            </View>
          )}

          {userData?.created_at && (
            <View style={styles.joinBadge}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
              <Text style={styles.joinText}>
                Bergabung {new Date(userData.created_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Pengaturan</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ChangePasswordScreen')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBg, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.menuText}>Ubah Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBg, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            </View>
            <Text style={[styles.menuText, { color: COLORS.error }]}>Keluar</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Versi Aplikasi 1.0.0</Text>
          <Text style={styles.versionSubtext}>© 2025</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#86efac' },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 280 },
  scrollContent: { paddingTop: 100, paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#86efac',
  },
  loadingText: { fontSize: 16, color: '#64748b' },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 30,
    marginHorizontal: 24,
    marginBottom: 20,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'white',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
  },
  joinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  joinText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  versionContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 10,
    color: '#cbd5e1',
  },
});
