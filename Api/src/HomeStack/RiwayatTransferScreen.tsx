import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ipAddress } from '../../IpPublic';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../constants/theme';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface Transfer {
  id: number;
  notrans_2210023: string;
  tanggal_2210023: string;
  jumlah_2210023: number;
  keterangan_2210023: string;
  status_2210023: string;
  pengirim?: {
    id: number;
    name: string;
    email: string;
  };
  penerima?: {
    id: number;
    name: string;
    email: string;
  };
}

export default function RiwayatTransferScreen({ navigation }: { navigation: any }) {
  const [transferKeluar, setTransferKeluar] = useState<Transfer[]>([]);
  const [transferMasuk, setTransferMasuk] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'keluar' | 'masuk'>('keluar');

  const fetchRiwayat = async () => {
    const token = (await AsyncStorage.getItem('userToken')) || (await AsyncStorage.getItem('user_token'));
    try {
      const response = await fetch(`${ipAddress}/transfer/riwayat`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const res = await response.json();
      if (response.ok && res.success) {
        setTransferKeluar(res.data.transfer_keluar_2210023 || []);
        setTransferMasuk(res.data.transfer_masuk_2210023 || []);
      }
    } catch (error) {
      console.log('Error fetching riwayat:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRiwayat();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRiwayat();
  };

  const renderTransferItem = (item: Transfer, type: 'keluar' | 'masuk') => {
    const isKeluar = type === 'keluar';
    const otherUser = isKeluar ? item.penerima : item.pengirim;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() => navigation.navigate('DetailTransfer', { notrans: item.notrans_2210023 })}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBg, isKeluar ? { backgroundColor: '#fee2e2' } : { backgroundColor: '#d1fae5' }]}>
          <Ionicons name={isKeluar ? 'arrow-up' : 'arrow-down'} size={20} color={isKeluar ? COLORS.error : COLORS.success} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{otherUser?.name || 'Unknown'}</Text>
          <Text style={styles.cardEmail}>{otherUser?.email || ''}</Text>
          <Text style={styles.cardDate}>{item.tanggal_2210023}</Text>
        </View>
        <View style={styles.cardAmount}>
          <Text style={[styles.amountText, isKeluar ? { color: COLORS.error } : { color: COLORS.success }]}>
            {isKeluar ? '-' : '+'} Rp {item.jumlah_2210023.toLocaleString('id-ID')}
          </Text>
          <Text style={styles.statusText}>{item.status_2210023}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Riwayat Transfer</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'keluar' && styles.activeTab]}
            onPress={() => setActiveTab('keluar')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'keluar' && styles.activeTabText]}>
              Keluar ({transferKeluar.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'masuk' && styles.activeTab]}
            onPress={() => setActiveTab('masuk')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'masuk' && styles.activeTabText]}>
              Masuk ({transferMasuk.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.scrollContent}
        >
          {activeTab === 'keluar' ? (
            transferKeluar.length > 0 ? (
              transferKeluar.map((item) => renderTransferItem(item, 'keluar'))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
                <Text style={styles.emptyText}>Belum ada transfer keluar</Text>
              </View>
            )
          ) : transferMasuk.length > 0 ? (
            transferMasuk.map((item) => renderTransferItem(item, 'masuk'))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>Belum ada transfer masuk</Text>
            </View>
          )}
        </ScrollView>
      </View>
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
  content: { flex: 1, marginTop: -40, paddingHorizontal: 20 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 6,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: 'white',
  },
  scrollContent: { paddingBottom: 20 },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  cardEmail: { fontSize: 12, color: '#94a3b8', marginBottom: 2 },
  cardDate: { fontSize: 12, color: '#cbd5e1' },
  cardAmount: { alignItems: 'flex-end' },
  amountText: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  statusText: { fontSize: 11, color: '#94a3b8' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#86efac',
  },
});
