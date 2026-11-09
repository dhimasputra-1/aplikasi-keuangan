import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, StatusBar, TouchableOpacity } from 'react-native';
import { ipAddress } from '../../IpPublic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, NavigationProp } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../constants/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  HomePage: undefined;
  AddKasMasuk: undefined;
  DetailKasMasuk: { item: any } | undefined;
};

type Props = {
  navigation: NavigationProp<RootStackParamList>;
  route?: any;
};

export default function MasukUangPage({ navigation, route }: Props) {
  const [kasMasuk, setKasMasuk] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKasMasuk = async () => {
    const token = (await AsyncStorage.getItem('user_token')) || (await AsyncStorage.getItem('userToken')) || '';

    try {
      const response = await fetch(`${ipAddress}/kasmasuk/data`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = null;
      }

      if (response.ok) {
        const list = (data?.data || []).map((it: any) => ({
          id: it.id || it.notrans || it.no || it.id_2210023 || null,
          notrans: it.notrans || it.notrans_2210023 || it.no || '',
          tanggal: it.tanggal || it.tanggal_2210023 || it.created_at || '',
          keterangan: it.keterangan || it.keterangan_2210023 || it.deskripsi || '',
          jumlahuang: it.jumlahuang || it.jumlahuang_2210023 || it.jmluang || 0,
          raw: it,
        }));

        if (route && route.params && route.params.newItem) {
          const it = route.params.newItem;
          const newItem = {
            id: it.id || it.notrans || it.no || it.id_2210023 || null,
            notrans: it.notrans || it.notrans_2210023 || it.no || '',
            tanggal: it.tanggal || it.tanggal_2210023 || it.created_at || '',
            keterangan: it.keterangan || it.keterangan_2210023 || it.deskripsi || '',
            jumlahuang: it.jumlahuang || it.jumlahuang_2210023 || it.jmluang || 0,
            raw: it,
          };
          const filteredList = list.filter((p: any) => {
            if (newItem.notrans && p.notrans === newItem.notrans) return false;
            if (newItem.id && p.id === newItem.id) return false;
            return true;
          });
          setKasMasuk([newItem, ...filteredList]);
          (navigation as any).setParams({ newItem: undefined });
        } else if (route && route.params && route.params.updatedItem) {
          const it = route.params.updatedItem;
          const updated = {
            id: it.id || it.notrans || it.no || it.id_2210023 || null,
            notrans: it.notrans || it.notrans_2210023 || it.no || '',
            tanggal: it.tanggal || it.tanggal_2210023 || it.created_at || '',
            keterangan: it.keterangan || it.keterangan_2210023 || it.deskripsi || '',
            jumlahuang: it.jumlahuang || it.jumlahuang_2210023 || it.jmluang || 0,
            raw: it,
          };
          setKasMasuk(prev => {
            let idx = prev.findIndex(p => updated.notrans && p.notrans === updated.notrans);
            if (idx < 0 && updated.id) {
              idx = prev.findIndex(p => p.id === updated.id);
            }
            if (idx >= 0) {
              const newList = [...prev];
              newList[idx] = updated;
              return newList;
            }
            return prev;
          });
          (navigation as any).setParams({ updatedItem: undefined });
        } else if (route && route.params && route.params.deletedId) {
          const deletedId = route.params.deletedId;
          setKasMasuk(prev => prev.filter(p => p.id !== deletedId));
          (navigation as any).setParams({ deletedId: undefined });
        } else {
          setKasMasuk(list);
        }
      } else {
        const message = (data && data.message) || text || `Fetch failed: ${response.status}`;
        Alert.alert('Gagal', message);
      }
    } catch (error) {
      Alert.alert('Error fetching data', String(error));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchKasMasuk();
    }, [route?.params?.newItem, route?.params?.updatedItem, route?.params?.deletedId])
  );

  const formatTanggal = (tanggal: string) => {
    const date = new Date(tanggal);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return new Intl.DateTimeFormat('id-ID', options).format(date);
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DetailKasMasuk', { item })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconBg, { backgroundColor: '#d1fae5' }]}>
          <Ionicons name="arrow-down" size={20} color={COLORS.success} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>No.Ref: {item.notrans}</Text>
          <Text style={styles.cardDate}>{formatTanggal(item.tanggal)}</Text>
        </View>
        <Text style={styles.cardAmount}>+Rp {item.jumlahuang.toLocaleString('id-ID')}</Text>
      </View>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.keterangan}</Text>
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>Data Kas Masuk</Text>
          <TouchableOpacity onPress={() => (navigation as any).replace('HomePage')} style={styles.homeBtn}>
            <Ionicons name="home" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={kasMasuk}
            keyExtractor={(item, index) => {
              if (item.notrans) return `masuk_${item.notrans}`;
              if (item.id) return `masuk_${item.id}`;
              return `masuk_${index}_${Date.now()}`;
            }}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
                <Text style={styles.emptyText}>Belum ada data kas masuk</Text>
              </View>
            }
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddKasMasuk')}
        activeOpacity={0.8}
      >
        <LinearGradient colors={COLORS.gradientPrimary} style={styles.fabGradient}>
          <Ionicons name="add" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>
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
  homeBtn: { padding: 8 },
  headerTitle: { fontSize: 20, color: 'white', fontWeight: '700' },
  content: { flex: 1, marginTop: -40, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#64748b' },
  listContent: { paddingBottom: 100 },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
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
  cardDate: { fontSize: 12, color: '#94a3b8' },
  cardAmount: { fontSize: 16, fontWeight: '700', color: COLORS.success },
  cardDesc: { fontSize: 13, color: '#64748b', marginTop: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 16 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    ...SHADOWS.large,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
