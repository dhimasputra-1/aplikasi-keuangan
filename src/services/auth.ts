import api from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function login(email: string, password: string) {
  try {
    console.log('login request:', { email });
    const res = await api.post('/auth/login', { email, password }); // sesuaikan endpoint
    console.log('login response:', res.data);
    const token = res.data?.token;
    if (!token) throw new Error('Tidak menerima token dari server');
    await AsyncStorage.setItem('authToken', token);
    return res.data;
  } catch (err: any) {
    console.error('login error:', err.response?.data || err.message);
    const msg =
      err.message && err.message.includes('Network request failed')
        ? 'Tidak dapat terhubung ke server. Periksa API_BASE_URL dan koneksi jaringan'
        : err.response?.data?.message || err.message || 'Login gagal';
    throw new Error(msg);
  }
}

export async function logout() {
  await AsyncStorage.removeItem('authToken');
}
