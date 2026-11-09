import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { ipAddress, ipsaja } from '../../IpPublic';
import { COLORS } from '../constants/theme';

interface User {
  id: number;
  name: string;
  email: string;
  photo?: string | null;
  photo2210023?: string | null;
}

export default function KirimUangScreen({ navigation, route }: { navigation: any, route: any }) {
  const [emailPenerima, setEmailPenerima] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userPenerima, setUserPenerima] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saldoUser, setSaldoUser] = useState(0);

  useEffect(() => {
    fetchSaldo();
    // Check if we received scanned data from ScanQrScreen
    if (route.params?.scannedData) {
      const scannedRef = route.params.scannedData;

      const processQr = async () => {
        try {
          const currentSaldo = await fetchSaldo();
          const data = JSON.parse(scannedRef);

          if (data.type === 'TRANSFER' && (data.email || data.noref)) {
            if (data.email) setEmailPenerima(data.email);
            const jm = data.jumlah ? data.jumlah.toString() : '';
            setJumlah(jm);
            const ket = data.noref ? `Pembayaran Ref: ${data.noref}` : 'Transfer via QR';
            setKeterangan(ket);

            if (data.email) {
              const userFound = await cariUserByEmail(data.email);
              if (userFound) {
                setTimeout(() => {
                  handleKirimUang(userFound, jm, ket, currentSaldo);
                }, 500);
              }
            } else {
              Alert.alert('Info', 'Email penerima tidak ditemukan dalam QR. Silakan masukkan manual.');
            }
          } else {
            setKeterangan(`Ref: ${scannedRef}`);
            Alert.alert('Info', `QR Code Terdeteksi. Silakan masukkan email penerima.`);
          }
        } catch (e) {
          setKeterangan(`Ref: ${scannedRef}`);
          Alert.alert('Info', `QR Code Terdeteksi. Silakan masukkan email penerima.`);
        }
      };

      processQr();
    }
  }, [route.params]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchSaldo();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchSaldo = async () => {
    const token = (await AsyncStorage.getItem('userToken')) || (await AsyncStorage.getItem('user_token'));
    try {
      const response = await fetch(`${ipAddress}/get-saldo`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const res = await response.json();
      if (response.ok) {
        const val = parseFloat(res.data?.jumlahsaldo ?? '0');
        setSaldoUser(val);
        return val;
      }
    } catch (error) {
      console.log('Error fetching saldo:', error);
    }
    return 0;
  };

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    const token = (await AsyncStorage.getItem('userToken')) || (await AsyncStorage.getItem('user_token'));
    try {
      const response = await fetch(`${ipAddress}/transfer/users`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();
      try {
        const res = JSON.parse(text);
        if (response.ok && res.success) {
          setAllUsers(res.data);
          setShowUserModal(true);
        } else {
          Alert.alert('Error', res.msg || res.message || `Gagal mengambil daftar user (${response.status})`);
        }
      } catch (e) {
        console.error('JSON Parse Error:', text);
        Alert.alert('Error', 'Respon server tidak valid');
      }
    } catch (error) {
      Alert.alert('Error', `Terjadi kesalahan jaringan: ${error}`);
    } finally {
      setLoadingUsers(false);
    }
  };


  const cariUserByEmail = async (emailOverride?: string): Promise<User | null> => {
    const emailToSearch = emailOverride || emailPenerima;
    if (!emailToSearch.trim()) {
      Alert.alert('Peringatan', 'Masukkan email penerima');
      return null;
    }
    setSearchLoading(true);
    const token = (await AsyncStorage.getItem('userToken')) || (await AsyncStorage.getItem('user_token'));
    try {
      const response = await fetch(`${ipAddress}/transfer/cari-user`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email_2210023: emailToSearch }),
      });

      const text = await response.text();
      try {
        const res = JSON.parse(text);
        if (response.ok && res.success) {
          setUserPenerima(res.data);
          return res.data;
        } else {
          setUserPenerima(null);
          Alert.alert('Error', res.msg || res.message || 'User tidak ditemukan');
          return null;
        }
      } catch (e) {
        console.error('JSON Parse Error:', text);
        Alert.alert('Error', 'Respon server tidak valid saat mencari user');
        return null;
      }
    } catch (error) {
      Alert.alert('Error', `Terjadi kesalahan saat mencari user: ${error}`);
      return null;
    } finally {
      setSearchLoading(false);
    }
  };

  const handleKirimUang = async (userOverride?: User, jumlahOverride?: string, ketOverride?: string, saldoOverride?: number) => {
    const targetUser = userOverride || userPenerima;
    const targetJumlah = jumlahOverride || jumlah;
    const targetKet = ketOverride || keterangan;
    const currentSaldo = saldoOverride !== undefined ? saldoOverride : saldoUser;

    if (!targetUser) {
      Alert.alert('Peringatan', 'Pilih penerima terlebih dahulu');
      return;
    }
    if (!targetJumlah || parseFloat(targetJumlah) <= 0) {
      Alert.alert('Peringatan', 'Masukkan jumlah yang valid');
      return;
    }
    if (!targetKet.trim()) {
      Alert.alert('Peringatan', 'Masukkan keterangan transfer');
      return;
    }
    if (parseFloat(targetJumlah) > currentSaldo) {
      Alert.alert('Peringatan', 'Saldo tidak mencukupi');
      return;
    }

    Alert.alert(
      'Konfirmasi Transfer',
      `Kirim Rp ${parseFloat(targetJumlah).toLocaleString('id-ID')} ke ${targetUser.name}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Kirim', onPress: () => prosesKirimUang(targetUser, targetJumlah, targetKet) },
      ]
    );
  };

  const prosesKirimUang = async (u?: User, j?: string, k?: string) => {
    const targetUser = u || userPenerima;
    const targetJumlah = j || jumlah;
    const targetKet = k || keterangan;

    setLoading(true);
    const token = (await AsyncStorage.getItem('userToken')) || (await AsyncStorage.getItem('user_token'));
    try {
      const response = await fetch(`${ipAddress}/transfer/kirim`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email_penerima_2210023: targetUser?.email,
          jumlah_2210023: parseFloat(targetJumlah),
          keterangan_2210023: targetKet,
        }),
      });
      const res = await response.json();
      if (response.ok && res.success) {
        Alert.alert('Sukses', res.message || 'Transfer berhasil!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Gagal', res.msg || 'Transfer gagal');
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat melakukan transfer');
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (user: User) => {
    setUserPenerima(user);
    setEmailPenerima(user.email);
    setShowUserModal(false);
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const photoUrl = item.photo2210023 || item.photo;
    return (
      <TouchableOpacity style={styles.userItemCard} onPress={() => selectUser(item)}>
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl.startsWith('http') ? photoUrl : `${ipsaja}${photoUrl}` }}
            style={styles.userPhoto}
          />
        ) : (
          <View style={styles.userPhotoPlaceholder}>
            <Ionicons name="person" size={28} color={COLORS.primary} />
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    );
  };


  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#86efac" barStyle="dark-content" />

      {/* SVG Curved Header */}
      <View style={styles.headerContainer}>
        <Svg height="160" width="100%" style={styles.svgCurve}>
          <Defs>
            <SvgLinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={COLORS.gradientPrimary[0]} stopOpacity="1" />
              <Stop offset="100%" stopColor={COLORS.gradientPrimary[1]} stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <Path
            d="M0,0 L414,0 L414,120 Q207,150 0,120 Z"
            fill="url(#grad)"
          />
          <Circle cx="70" cy="35" r="35" fill="rgba(255,255,255,0.1)" />
          <Circle cx="330" cy="85" r="50" fill="rgba(255,255,255,0.08)" />
        </Svg>

        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kirim Uang</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceIconContainer}>
            <Ionicons name="wallet-outline" size={24} color={COLORS.success} />
          </View>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Saldo Tersedia</Text>
            <Text style={styles.balanceAmount}>Rp {saldoUser.toLocaleString('id-ID')}</Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Informasi Penerima</Text>
          </View>

          <Text style={styles.label}>Email Penerima</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.inputWithIcon}
              placeholder="Masukkan email penerima"
              placeholderTextColor="#999"
              value={emailPenerima}
              onChangeText={setEmailPenerima}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {userPenerima && (
            <View style={styles.selectedUserCard}>
              <View style={styles.selectedUserIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              </View>
              <View style={styles.selectedUserInfo}>
                <Text style={styles.selectedUserLabel}>Penerima Dipilih</Text>
                <Text style={styles.selectedUserName}>{userPenerima.name}</Text>
                <Text style={styles.selectedUserEmail}>{userPenerima.email}</Text>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Detail Transfer</Text>
          </View>

          <Text style={styles.label}>Jumlah Transfer</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencyPrefix}>Rp</Text>
            <TextInput
              style={styles.inputWithPrefix}
              placeholder="0"
              placeholderTextColor="#999"
              value={jumlah}
              onChangeText={setJumlah}
              keyboardType="numeric"
            />
          </View>



          <TouchableOpacity
            onPress={() => handleKirimUang()}
            disabled={loading}
            style={styles.submitButtonContainer}
          >
            <LinearGradient
              colors={loading ? ['#fca5a5', '#fca5a5'] : COLORS.gradientRed}
              style={styles.submitButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Kirim Uang</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* User Selection Modal */}
      <Modal visible={showUserModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="people" size={24} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Pilih Penerima</Text>
              </View>
              <TouchableOpacity onPress={() => setShowUserModal(false)} style={styles.closeButton}>
                <Ionicons name="close-circle" size={28} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={allUsers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderUserItem}
              contentContainerStyle={styles.userList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>Tidak ada user tersedia</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#86efac',
  },
  headerContainer: {
    height: 160,
    position: 'relative',
  },
  svgCurve: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 45,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
    marginTop: -40,
  },
  balanceCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  balanceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  balanceAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  formCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginLeft: 9,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 7,
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 9,
  },
  inputWithIcon: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 10,
  },
  currencyPrefix: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginRight: 7,
  },
  inputWithPrefix: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 75,
    paddingTop: 10,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 5,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  userListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 10,
    gap: 7,
  },
  userListButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginLeft: -20,
  },
  selectedUserCard: {
    flexDirection: 'row',
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  selectedUserIcon: {
    marginRight: 10,
  },
  selectedUserInfo: {
    flex: 1,
  },
  selectedUserLabel: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  selectedUserName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 2,
  },
  selectedUserEmail: {
    fontSize: 12,
    color: '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  submitButtonContainer: {
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '85%',
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 3,
  },
  userList: {
    padding: 10,
  },
  userItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    marginVertical: 5,
    marginHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  userPhoto: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  userPhotoPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  userInfo: {
    marginLeft: 13,
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 14,
  },
});
