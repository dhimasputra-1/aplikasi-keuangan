import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StatusBar, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ipAddress } from '../../IpPublic';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

type RootStackParamList = {
  AddKasKeluar: undefined;
  KasKeluarPage: undefined;
};
type Props = NativeStackScreenProps<RootStackParamList, 'AddKasKeluar'>;

export default function AddKasKeluar({ navigation, route }: Props) {
  const existing = (route && (route as any).params && (route as any).params.item) || null;
  const [tanggal, setTanggal] = useState(existing?.tanggal ? (new Date(existing.tanggal)).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [keterangan, setKeterangan] = useState(existing?.keterangan || '');
  const [jumlah, setJumlah] = useState(existing ? String(existing.jumlahuang || existing.jumlah || '') : '');
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(existing?.tanggal ? new Date(existing.tanggal) : new Date());

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      setTanggal(date.toISOString().split('T')[0]);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('id-ID', options);
  };

  const handleSubmit = async () => {
    if (!tanggal || !keterangan || !jumlah) {
      Alert.alert('Validasi', 'Silakan isi Tanggal, Keterangan, dan Jumlah');
      return;
    }

    if (isNaN(Number(jumlah)) || Number(jumlah) <= 0) {
      Alert.alert('Validasi', 'Jumlah harus berupa angka lebih dari 0');
      return;
    }

    setSubmitting(true);
    const token = (await AsyncStorage.getItem('user_token')) || (await AsyncStorage.getItem('userToken')) || '';

    if (!token) {
      Alert.alert('Gagal', 'Token tidak ditemukan. Silakan login ulang.');
      setSubmitting(false);
      return;
    }

    console.log('📌 AddKasKeluar - Token:', token.substring(0, 20) + '...');

    // Standard payload format that backend expects
    const createUpdatePayload = { tgl: tanggal, jmluang: Number(jumlah), ket: keterangan };
    console.log('📌 Payload:', createUpdatePayload);

    // If editing existing item
    if (existing) {
      const notrans = existing.notrans;
      if (!notrans) {
        Alert.alert('Gagal', 'Nomor transaksi tidak ditemukan untuk edit');
        setSubmitting(false);
        return;
      }

      const updateEndpoints = [
        { method: 'PUT', url: `${ipAddress}/kaskeluar/${notrans}/edit` },
      ];

      try {
        let lastErr: any = null;
        for (const endpoint of updateEndpoints) {
          try {
            console.log(`📌 Trying ${endpoint.method}`, endpoint.url, createUpdatePayload);
            const res = await fetch(endpoint.url, {
              method: endpoint.method,
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: token ? `Bearer ${token}` : '',
              },
              body: JSON.stringify(createUpdatePayload),
            });

            const txt = await res.text();
            let data: any = null;
            try { data = JSON.parse(txt); } catch (e) { data = null; }

            console.log(`📌 ${endpoint.method} ${endpoint.url}:`, { status: res.status, body: txt, parsed: data });

            if (res.ok) {
              // Normalize updated item
              const updated = (data && data.data) || (data && data.updated) || data || createUpdatePayload;
              const norm = {
                id: updated.id || null,
                notrans: updated.notrans_2210023 || updated.notrans || notrans,
                tanggal: updated.tanggal_2210023 || updated.tanggal || createUpdatePayload.tgl,
                keterangan: updated.keterangan_2210023 || updated.keterangan || createUpdatePayload.ket,
                jumlahuang: updated.jumlahuang_2210023 || updated.jumlahuang || updated.jmluang || createUpdatePayload.jmluang,
                raw: updated,
              };
              Alert.alert('Berhasil', 'Data kas keluar berhasil diperbarui', [
                {
                  text: 'OK',
                  onPress: () => {
                    try {
                      navigation.navigate({ name: 'KasKeluarPage', params: { updatedItem: norm }, merge: true } as any);
                    } catch (e) { }
                  },
                },
              ]);
              return;
            } else if (res.status === 404 || res.status === 405 || res.status === 403) {
              lastErr = { endpoint: endpoint.url, method: endpoint.method, status: res.status, body: txt };
              continue;
            } else {
              const message = (data && data.message) || txt || `Request failed with status ${res.status}`;
              console.warn(`Update failed on ${endpoint.method} ${endpoint.url}`, { status: res.status, message });
              lastErr = { endpoint: endpoint.url, method: endpoint.method, status: res.status, message };
              continue;
            }
          } catch (err) {
            lastErr = err;
            continue;
          }
        }

        console.error('All update endpoints failed', lastErr);
        Alert.alert('Gagal', `Update gagal. Terakhir: ${lastErr?.body || lastErr?.message || lastErr}`);
        return;
      } catch (e) {
        Alert.alert('Error', 'Terjadi kesalahan jaringan');
        console.error(e);
      } finally {
        setSubmitting(false);
      }
    }

    // Create new item
    const endpoints = [
      { method: 'POST', url: `${ipAddress}/kaskeluar` },
      { method: 'POST', url: `${ipAddress}/kaskeluar/create` },
    ];

    try {
      let lastError: any = null;
      for (const endpoint of endpoints) {
        try {
          console.log(`📌 Trying ${endpoint.method}`, endpoint.url, createUpdatePayload);
          const response = await fetch(endpoint.url, {
            method: endpoint.method,
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify(createUpdatePayload),
          });

          const text = await response.text();
          let data: any = null;
          try {
            data = JSON.parse(text);
          } catch (e) {
            data = null;
          }

          console.log(`📌 ${endpoint.method} ${endpoint.url}:`, { status: response.status, body: text, parsed: data });

          // Check for error in response first (even if status 200)
          if (data && (data.error || data.message === 'No query results for model' || (data.status && data.status !== 'success'))) {
            const errorMsg = data.error || data.message || data.msg || 'Unknown error';
            console.warn(`⚠️ Response error (status ${response.status}):`, errorMsg);
            lastError = { endpoint: endpoint.url, method: endpoint.method, status: response.status, message: errorMsg };
            continue;
          }

          const created = (data && data.data) || (data && data.created) || data || null;
          if ((response.status === 201 || response.status === 200) && created && (created.id || created.notrans || created.notrans_2210023)) {
            const norm = {
              id: created.id || created.id_2210023 || created.notrans_2210023 || `local_${Date.now()}`,
              notrans: created.notrans_2210023 || created.notrans || created.no || `notrans_${Date.now()}`,
              tanggal: created.tanggal_2210023 || created.tanggal || created.created_at || createUpdatePayload.tgl,
              keterangan: created.keterangan_2210023 || created.keterangan || createUpdatePayload.ket,
              jumlahuang: created.jumlahuang_2210023 || created.jumlahuang || created.jmluang || createUpdatePayload.jmluang,
              raw: created,
            };
            Alert.alert('Berhasil', 'Data kas keluar berhasil ditambahkan', [
              {
                text: 'OK',
                onPress: () => {
                  try {
                    navigation.navigate({ name: 'KasKeluarPage', params: { newItem: norm }, merge: true } as any);
                  } catch (e) {
                    // ignore
                  }
                },
              },
            ]);
            return;
          } else if (response.ok && created && (created.notrans || created.notrans_2210023)) {
            const norm = {
              id: created.id || created.id_2210023 || created.notrans_2210023 || `local_${Date.now()}`,
              notrans: created.notrans_2210023 || created.notrans || created.no || `notrans_${Date.now()}`,
              tanggal: created.tanggal_2210023 || created.tanggal || created.created_at || createUpdatePayload.tgl,
              keterangan: created.keterangan_2210023 || created.keterangan || createUpdatePayload.ket,
              jumlahuang: created.jumlahuang_2210023 || created.jumlahuang || created.jmluang || createUpdatePayload.jmluang,
              raw: created,
            };
            Alert.alert('Berhasil', 'Data kas keluar berhasil ditambahkan', [
              {
                text: 'OK',
                onPress: () => {
                  try {
                    navigation.navigate({ name: 'KasKeluarPage', params: { newItem: norm }, merge: true } as any);
                  } catch (e) { }
                },
              },
            ]);
            return;
          } else if (response.status >= 500) {
            // Server error — capture full response for debugging
            const errorMsg = (data && (data.message || data.error || data.msg)) || text || `Server error (500+)`;
            console.error(`❌ Server error (status ${response.status}):`, text);
            lastError = { endpoint: endpoint.url, method: endpoint.method, status: response.status, message: errorMsg, fullResponse: text };
            continue;
          } else if (response.status >= 400) {
            // Client error
            const errorMsg = (data && (data.message || data.error || data.msg)) || text || `Request error (${response.status})`;
            console.warn(`⚠️ Request error (status ${response.status}):`, errorMsg);
            lastError = { endpoint: endpoint.url, method: endpoint.method, status: response.status, message: errorMsg };
            continue;
          } else {
            const message = (data && (data.message || data.msg || data.error)) || text || `Request failed with status ${response.status}`;
            console.warn(`❌ Create failed on ${endpoint.method} ${endpoint.url}`, { status: response.status, message, data });
            lastError = { endpoint: endpoint.url, method: endpoint.method, status: response.status, message };
            continue;
          }
        } catch (err) {
          lastError = err;
          continue;
        }
      }

      console.error('❌ All endpoints failed', lastError);
      const errMsg = lastError?.message || lastError?.body || JSON.stringify(lastError);
      Alert.alert('Gagal', `${errMsg}`);
    } catch (e) {
      const errMsg = (e as any)?.message || String(e);
      Alert.alert('Error', `Jaringan error: ${errMsg}`);
      console.error('❌ Network error:', e);
    } finally {
      setSubmitting(false);
    }
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
          <Text style={styles.headerTitle}>{existing ? 'Edit Kas Keluar' : 'Tambah Kas Keluar'}</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <View style={styles.formIconContainer}>
                <Ionicons name="trending-down" size={24} color="#ef4444" />
              </View>
              <Text style={styles.formHeaderText}>Informasi Kas Keluar</Text>
            </View>

            <Text style={styles.label}>Tanggal</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <Text style={styles.datePickerText}>{formatDisplayDate(tanggal)}</Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <Text style={styles.label}>Keterangan</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                value={keterangan}
                onChangeText={setKeterangan}
                style={styles.inputWithIcon}
                placeholder="Masukkan keterangan"
                placeholderTextColor="#999"
              />
            </View>

            <Text style={styles.label}>Jumlah</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencyPrefix}>Rp</Text>
              <TextInput
                value={jumlah}
                onChangeText={setJumlah}
                style={styles.inputWithPrefix}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
              style={styles.submitButtonContainer}
            >
              <LinearGradient
                colors={submitting ? ['#fca5a5', '#fca5a5'] : COLORS.gradientRed}
                style={styles.submitButton}
              >
                <Ionicons name={submitting ? "hourglass-outline" : "checkmark-circle"} size={20} color="white" />
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Menyimpan...' : (existing ? 'Update Data' : 'Simpan Data')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}
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
  scrollContentContainer: {
    paddingBottom: 30,
  },
  formCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 0,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  formIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  formHeaderText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 7,
    marginTop: 14,
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
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  datePickerText: {
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
  submitButtonContainer: {
    marginTop: 24,
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
});
