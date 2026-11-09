import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ipAddress } from '../../IpPublic';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/theme';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Helper function to format currency to Indonesian format (60.000,00)
const formatCurrency = (amount: number): string => {
  const numericAmount = Number(amount);

  if (amount === null || amount === undefined || isNaN(numericAmount)) {
    return '0,00';
  }

  const fixed = numericAmount.toFixed(2);
  const parts = fixed.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Add thousand separators
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return integerPart + ',' + decimalPart;
};

export default function HomeScreen({ navigation }: { navigation: any }) {
  const [_user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [jumlahSaldo, setJumlahSaldo] = useState(0);
  const [loadingSaldo, setLoadingSaldo] = useState(true);

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const fetchUserProfile = useCallback(async () => {
    const token = await AsyncStorage.getItem('user_token');
    if (!token) {
      navigation.replace('Login');
      return;
    }
    try {
      const response = await fetch(`${ipAddress}/data-pengguna`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setUser(data.user);
      else navigation.replace('Login');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  const fetchSaldoUser = useCallback(async () => {
    setLoadingSaldo(true);
    const token = (await AsyncStorage.getItem('userToken')) || (await AsyncStorage.getItem('user_token'));
    try {
      const response = await fetch(`${ipAddress}/get-saldo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await response.json();
      if (response.ok) setJumlahSaldo(res.data?.jumlahsaldo ?? 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSaldo(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      fetchSaldoUser();
    }, [fetchUserProfile, fetchSaldoUser])
  );

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Animated Header Background */}
      <Animated.View style={[styles.headerBg, { transform: [{ translateY: headerTranslate }] }]}>
        <Svg height={300} width={width} viewBox={`0 0 ${width} 300`}>
          <Defs>
            <SvgGradient id="headerGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={COLORS.gradientPrimary[0]} />
              <Stop offset="1" stopColor={COLORS.gradientPrimary[1]} />
            </SvgGradient>
          </Defs>
          <Path d={`M0 0 H${width} V220 Q${width / 2} 280 0 220 Z`} fill="url(#headerGrad)" />
          <Circle cx={width - 50} cy={50} r={80} fill="rgba(255,255,255,0.1)" />
          <Circle cx={30} cy={120} r={60} fill="rgba(255,255,255,0.05)" />
        </Svg>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Halo, Selamat Datang 👋</Text>
            <Text style={styles.userName}>{_user?.name || 'Pengguna'}</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn}>
            <Image source={require('../../../assets/images/gunung1.jpg')} style={styles.avatar} />
            <View style={styles.onlineDot} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <Animated.View style={[styles.balanceCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.cardGradient}>
            <View style={styles.cardHeader}>
              <View style={styles.walletIcon}>
                <Ionicons name="wallet" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.balanceLabel}>Saldo Utama</Text>
              <TouchableOpacity style={styles.eyeIcon}>
                <Ionicons name="eye-outline" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.balanceAmount}>
              <Text style={styles.currency}>Rp</Text>
              {loadingSaldo ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <Text style={styles.amount}>{formatCurrency(jumlahSaldo)}</Text>
              )}
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('MintaUang')}>
                <Ionicons name="arrow-down-circle" size={22} color={COLORS.primary} />
                <Text style={styles.quickBtnText}>Minta</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('KirimUang')}>
                <Ionicons name="arrow-up-circle" size={22} color={COLORS.success} />
                <Text style={styles.quickBtnText}>Kirim</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('RiwayatTransfer')}>
                <Ionicons name="time" size={22} color="#f59e0b" />
                <Text style={styles.quickBtnText}>Riwayat</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Services Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Layanan Favorit</Text>
          <View style={styles.servicesGrid}>
            {[
              { title: 'Uang Masuk', icon: require('../../../assets/images/uangmasuk.png'), nav: 'MasukUangPage', color: '#d1fae5', iconColor: '#059669' },
              { title: 'Uang Keluar', icon: require('../../../assets/images/moneyout.png'), nav: 'KasKeluarPage', color: '#fee2e2', iconColor: '#dc2626' },
              { title: 'Laporan', icon: require('../../../assets/images/laporan.png'), nav: 'Laporan', color: '#dbeafe', iconColor: '#2563eb' },
              { title: 'Lainnya', iconName: 'grid', nav: 'RiwayatTransfer', color: '#fef3c7', iconColor: '#f59e0b' },
            ].map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.serviceCard} onPress={() => navigation.navigate(item.nav)} activeOpacity={0.7}>
                <View style={[styles.serviceIcon, { backgroundColor: item.color }]}>
                  {item.iconName ? (
                    <Ionicons name={item.iconName as any} size={28} color={item.iconColor} />
                  ) : (
                    <Image source={item.icon} style={styles.serviceImg} />
                  )}
                </View>
                <Text style={styles.serviceTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>




        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#86efac' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: -1 },
  scrollContent: { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 50 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
  userName: { fontSize: 24, color: 'white', fontWeight: '700' },
  avatarBtn: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: 'white' },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10b981', borderWidth: 2, borderColor: 'white' },
  balanceCard: { marginHorizontal: 24, marginBottom: 24, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 12 },
  cardGradient: { borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'white' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  walletIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  balanceLabel: { flex: 1, fontSize: 14, color: '#64748b', fontWeight: '600' },
  eyeIcon: { padding: 4 },
  balanceAmount: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  currency: { fontSize: 18, color: COLORS.primary, fontWeight: 'bold', marginTop: 6, marginRight: 4 },
  amount: { fontSize: 36, color: '#0f172a', fontWeight: '800', letterSpacing: -1 },
  cardDivider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 16 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 4 },
  quickBtnText: { fontSize: 14, color: '#334155', fontWeight: '600', marginLeft: 6 },
  divider: { width: 1, height: 24, backgroundColor: '#e2e8f0' },
  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  seeAll: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  servicesGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  serviceCard: { width: '23%', alignItems: 'center' },
  serviceIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  serviceImg: { width: 28, height: 28, resizeMode: 'contain' },
  serviceTitle: { fontSize: 12, color: '#475569', textAlign: 'center', fontWeight: '500' },
  promoBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  promoContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  promoIcon: { marginRight: 16 },
  promoText: { flex: 1 },
  promoTitle: { fontSize: 16, color: 'white', fontWeight: 'bold', marginBottom: 2 },
  promoSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  activityIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  activityDate: { fontSize: 12, color: '#94a3b8' },
  activityAmount: { fontSize: 15, fontWeight: '700' },
});
