import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ipAddress, ipsaja } from '../../IpPublic';
import { COLORS } from '../constants/theme';

interface TransferDetail {
  id: number;
  notrans_2210023: string;
  tanggal_2210023: string;
  jumlah_2210023: number;
  keterangan_2210023: string;
  status_2210023: string;
  pengirim: {
    id: number;
    name: string;
    email: string;
    photo?: string | null;
    photo2210023?: string | null;
  };
  penerima: {
    id: number;
    name: string;
    email: string;
    photo?: string | null;
    photo2210023?: string | null;
  };
}

export default function DetailTransferScreen({ route, navigation }: { route: any; navigation: any }) {
  const { notrans } = route.params;
  const [transfer, setTransfer] = useState<TransferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchDetail();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const token = (await AsyncStorage.getItem('userToken')) || (await AsyncStorage.getItem('user_token'));
    try {
      const response = await fetch(`${ipAddress}/data-pengguna`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const res = await response.json();
      if (response.ok) {
        setCurrentUserId(res.user.id);
      }
    } catch (error) {
      console.log('Error fetching user:', error);
    }
  };

  const fetchDetail = async () => {
    const token = (await AsyncStorage.getItem('userToken')) || (await AsyncStorage.getItem('user_token'));
    try {
      const response = await fetch(`${ipAddress}/transfer/${notrans}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const res = await response.json();
      if (response.ok && res.success) {
        setTransfer(res.data);
      }
    } catch (error) {
      console.log('Error fetching detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!transfer) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Transfer tidak ditemukan</Text>
      </View>
    );
  }

  const isKeluar = transfer.pengirim.id === currentUserId;

  return (
    <ScrollView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <LinearGradient colors={COLORS.gradientPrimary} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Transfer</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, transfer.status_2210023 === 'success' && styles.statusSuccess]}>
          <Ionicons
            name={transfer.status_2210023 === 'success' ? 'checkmark-circle' : 'close-circle'}
            size={24}
            color="white"
          />
          <Text style={styles.statusText}>{transfer.status_2210023.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Jumlah Transfer</Text>
        <Text style={[styles.amountValue, isKeluar ? styles.amountKeluar : styles.amountMasuk]}>
          {isKeluar ? '-' : '+'} Rp {transfer.jumlah_2210023.toLocaleString('id-ID')}
        </Text>
      </View>

      <View style={styles.detailContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>No. Transaksi</Text>
          <Text style={styles.detailValue}>{transfer.notrans_2210023}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tanggal</Text>
          <Text style={styles.detailValue}>{transfer.tanggal_2210023}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Keterangan</Text>
          <Text style={styles.detailValue}>{transfer.keterangan_2210023}</Text>
        </View>
      </View>

      <View style={styles.userContainer}>
        <Text style={styles.sectionTitle}>Pengirim</Text>
        <View style={styles.userCard}>
          {(transfer.pengirim.photo2210023 || transfer.pengirim.photo) ? (
            <Image
              source={{
                uri: ((transfer.pengirim.photo2210023 || transfer.pengirim.photo) || '').startsWith('http')
                  ? (transfer.pengirim.photo2210023 || transfer.pengirim.photo) || ''
                  : `${ipsaja}${transfer.pengirim.photo2210023 || transfer.pengirim.photo || ''}`
              }}
              style={styles.userPhoto}
            />
          ) : (
            <View style={styles.userPhotoPlaceholder}>
              <Ionicons name="person" size={32} color={COLORS.primary} />
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{transfer.pengirim.name}</Text>
            <Text style={styles.userEmail}>{transfer.pengirim.email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.userContainer}>
        <Text style={styles.sectionTitle}>Penerima</Text>
        <View style={styles.userCard}>
          {(transfer.penerima.photo2210023 || transfer.penerima.photo) ? (
            <Image
              source={{
                uri: ((transfer.penerima.photo2210023 || transfer.penerima.photo) || '').startsWith('http')
                  ? (transfer.penerima.photo2210023 || transfer.penerima.photo) || ''
                  : `${ipsaja}${transfer.penerima.photo2210023 || transfer.penerima.photo || ''}`
              }}
              style={styles.userPhoto}
            />
          ) : (
            <View style={styles.userPhotoPlaceholder}>
              <Ionicons name="person" size={32} color={COLORS.primary} />
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{transfer.penerima.name}</Text>
            <Text style={styles.userEmail}>{transfer.penerima.email}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 34,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statusSuccess: {
    backgroundColor: COLORS.success,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  amountContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 5,
  },
  amountKeluar: {
    color: COLORS.secondary,
  },
  amountMasuk: {
    color: COLORS.success,
  },
  detailContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  userContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
});
