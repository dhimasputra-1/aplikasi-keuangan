import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { Appbar } from 'react-native-paper';
import { ipAddress } from '../../IpPublic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';
import LinearGradient from 'react-native-linear-gradient';

type RootStackParamList = {
  MasukUangPage: undefined;
  DetailKasMasuk: { item: any };
  AddKasMasuk: { item?: any } | undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'DetailKasMasuk'>;

export default function DetailKasMasuk({ navigation, route }: Props) {
  const item = route.params?.item || {};
  const [loading, setLoading] = useState(false);

  const id = item.id || item.notrans || item.no || null;

  const formatTanggal = (tanggal: string) => {
    try {
      const d = new Date(tanggal);
      return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return tanggal;
    }
  };

  const handleDelete = () => {
    Alert.alert('Konfirmasi', 'Hapus data kas masuk ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          if (!id) {
            Alert.alert('Gagal', 'ID tidak ditemukan');
            return;
          }
          setLoading(true);
          const token = (await AsyncStorage.getItem('user_token')) || (await AsyncStorage.getItem('userToken')) || '';
          const endpoints = [
            `${ipAddress}/kasmasuk/${id}/delete`,
          ];

          let lastError: any = null;
          for (const url of endpoints) {
            try {
              const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                  Authorization: token ? `Bearer ${token}` : '',
                },
              });

              if (res.ok) {
                Alert.alert('Berhasil', 'Data berhasil dihapus', [
                  {
                    text: 'OK',
                    onPress: () => {
                      try {
                        navigation.navigate({ name: 'MasukUangPage', params: { deletedId: id }, merge: true } as any);
                      } catch (e) { }
                    },
                  },
                ]);
                return;
              } else if (res.status === 404) {
                lastError = { url, status: res.status };
                continue;
              } else {
                const txt = await res.text();
                let d = null;
                try { d = JSON.parse(txt); } catch (e) { d = null; }
                const message = (d && d.message) || txt || `Request failed: ${res.status}`;
                Alert.alert('Gagal', message);
                setLoading(false);
                return;
              }
            } catch (err) {
              lastError = err;
              continue;
            }
          }

          setLoading(false);
          console.error('Delete failed', lastError);
          Alert.alert('Gagal', 'Hapus gagal. ' + (lastError?.message || 'Periksa endpoint di server'));
        },
      },
    ]);
  };

  const handleEdit = () => {
    navigation.navigate('AddKasMasuk' as any, { item });
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="white" />
        <Appbar.Content title="Detail Kas Masuk" titleStyle={{ color: 'white', fontWeight: 'bold' }} />
      </Appbar.Header>

      <View style={styles.card}>
        <Text style={styles.title}>No.Ref: {item.notrans || item.no || item.id}</Text>
        <Text style={styles.subtitle}>Tanggal: {formatTanggal(item.tanggal || item.created_at || '')}</Text>
        <Text style={styles.amount}>Jumlah: Rp {Number(item.jumlahuang || item.jumlah || 0).toLocaleString('id-ID')}</Text>
        <Text style={styles.ket}>Keterangan: {item.keterangan || item.deskripsi || ''}</Text>

        <View style={styles.actions}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, elevation: 4 },
  card: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12, elevation: 4, shadowColor: COLORS.primary, shadowOpacity: 0.1, shadowRadius: 4 },
  title: { fontWeight: '700', fontSize: 16, color: COLORS.textPrimary },
  subtitle: { color: '#666', marginTop: 6 },
  amount: { color: COLORS.success, fontWeight: '700', marginTop: 8, fontSize: 18 },
  ket: { marginTop: 8, color: '#444' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 },
  touchableBtn: { marginLeft: 12, borderRadius: 8, overflow: 'hidden' },
  actionBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center', alignItems: 'center', minWidth: 80 },
  actionText: { color: 'white', fontWeight: '700' },
});