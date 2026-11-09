import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Appbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ipAddress } from '../../IpPublic';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';
import LinearGradient from 'react-native-linear-gradient';

type RootStackParamList = {
  DetailKasKeluar: { item: any };
  KasKeluarPage: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'DetailKasKeluar'>;

export default function DetailKasKeluar({ navigation, route }: Props) {
  const { item } = route.params;
  const [loading, setLoading] = useState(false);

  const notrans = item.notrans || item.notrans_2210023 || item.no;

  const handleDelete = () => {
    Alert.alert('Konfirmasi', 'Hapus data kas keluar ini?', [
      {
        text: 'Batal',
        onPress: () => { },
        style: 'cancel',
      },
      {
        text: 'Hapus',
        onPress: async () => {
          setLoading(true);
          const token = (await AsyncStorage.getItem('user_token')) || (await AsyncStorage.getItem('userToken')) || '';

          const deleteEndpoints = [
            `${ipAddress}/kaskeluar/${notrans}/delete`,
          ];

          try {
            let lastError: any = null;
            for (const url of deleteEndpoints) {
              try {
                const res = await fetch(url, {
                  method: 'DELETE',
                  headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : '',
                  },
                });

                const txt = await res.text();
                let data: any = null;
                try { data = JSON.parse(txt); } catch (e) { data = null; }

                if (res.ok) {
                  Alert.alert('Berhasil', 'Data berhasil dihapus', [
                    {
                      text: 'OK',
                      onPress: () => {
                        try {
                          navigation.navigate({ name: 'KasKeluarPage', params: { deletedNotrans: notrans }, merge: true } as any);
                        } catch (e) { }
                      },
                    },
                  ]);
                  return;
                } else if (res.status === 404) {
                  lastError = { url, status: res.status, body: txt };
                  continue;
                } else {
                  const message = (data && data.message) || txt || `Request failed with status ${res.status}`;
                  console.warn('Delete failed', { url, status: res.status, message });
                  lastError = { url, status: res.status, message };
                  continue;
                }
              } catch (err) {
                lastError = err;
                continue;
              }
            }

            console.error('Delete failed', lastError);
            Alert.alert('Gagal', 'Hapus gagal. ' + (lastError?.message || 'Periksa endpoint di server'));
          } finally {
            setLoading(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleEdit = () => {
    navigation.navigate('AddKasKeluar' as any, { item });
  };

  const formatTanggal = (tanggal: string) => {
    const date = new Date(tanggal);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Intl.DateTimeFormat('id-ID', options).format(date);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="white" />
        <Appbar.Content title="Detail Kas Keluar" titleStyle={{ color: 'white', fontWeight: 'bold' }} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>No.Ref: {notrans}</Text>
          <Text style={styles.date}>Tanggal: {formatTanggal(item.tanggal)}</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Jumlah:</Text>
            <Text style={styles.amountText}>
              -Rp {item.jumlahuang.toLocaleString('id-ID')}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Keterangan:</Text>
            <Text style={styles.value}>{item.keterangan}</Text>
          </View>

          <View style={styles.actionContainer}>
            <TouchableOpacity onPress={handleDelete} disabled={loading} style={styles.touchableBtn}>
              <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.actionBtn}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.actionText}>Hapus</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleEdit} style={styles.touchableBtn}>
              <LinearGradient colors={COLORS.gradientPrimary} style={styles.actionBtn}>
                <Text style={styles.actionText}>Edit</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, elevation: 4 },
  content: { padding: 16 },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: COLORS.textPrimary },
  date: { fontSize: 14, color: '#666', marginBottom: 20 },
  row: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 4, color: '#555' },
  value: { fontSize: 16, color: '#333' },
  amountText: { fontSize: 20, fontWeight: 'bold', color: '#FF4757' },
  actionContainer: { flexDirection: 'row', marginTop: 24, justifyContent: 'flex-end' },
  touchableBtn: { marginLeft: 12, borderRadius: 8, overflow: 'hidden' },
  actionBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', minWidth: 90 },
  actionText: { color: 'white', fontWeight: '600', fontSize: 14 },
});
