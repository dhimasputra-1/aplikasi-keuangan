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
    FlatList,
    RefreshControl,
    Clipboard,
    StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ipAddress } from '../../IpPublic';
import QRCode from 'react-native-qrcode-svg';
import { COLORS } from '../constants/theme';

interface MintaUangHistory {
    id: number;
    noref_2210023: string;
    jumlahuang_2210023: number;
    stt_2210023: string;
    tglminta_2210023: string;
}

export default function MintaUangScreen({ navigation }: { navigation: any }) {
    const [jumlah, setJumlah] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<MintaUangHistory[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [createdRequest, setCreatedRequest] = useState<MintaUangHistory | null>(null);
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        fetchHistory();
        fetchUserProfile();
    }, []);

    const fetchHistory = async () => {
        setRefreshing(true);
        const token = (await AsyncStorage.getItem('userToken')) || (await AsyncStorage.getItem('user_token'));
        try {
            const response = await fetch(`${ipAddress}/mintauang/history`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const res = await response.json();
            if (response.ok && res.success) {
                setHistory(res.data);
            }
        } catch (error) {
            console.log('Error fetching history:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const fetchUserProfile = async () => {
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
            if (response.ok && res.user) {
                setUserEmail(res.user.email);
            }
        } catch (error) {
            console.log('Error fetching user profile:', error);
        }
    };

    const handleBuatPermintaan = async () => {
        if (!jumlah || parseFloat(jumlah) <= 0) {
            Alert.alert('Peringatan', 'Masukkan jumlah uang yang valid');
            return;
        }

        setLoading(true);
        const token = (await AsyncStorage.getItem('userToken')) || (await AsyncStorage.getItem('user_token'));

        try {
            const response = await fetch(`${ipAddress}/mintauang/create`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    jumlah_2210023: parseFloat(jumlah),
                }),
            });

            const res = await response.json();

            if (response.ok && res.success) {
                Alert.alert('Sukses', 'Permintaan uang berhasil dibuat');
                setCreatedRequest({
                    id: 0, // Temp ID, not needed for display
                    noref_2210023: res.data.noref_2210023,
                    jumlahuang_2210023: res.data.jumlah_2210023,
                    stt_2210023: res.data.status_2210023,
                    tglminta_2210023: new Date().toISOString()
                });
                setJumlah('');
                fetchHistory();
            } else {
                Alert.alert('Gagal', res.message || 'Gagal membuat permintaan');
            }
        } catch (error) {
            Alert.alert('Error', 'Terjadi kesalahan jaringan');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        Clipboard.setString(text);
        Alert.alert('Disalin', 'Kode referensi berhasil disalin');
    };

    const renderHistoryItem = ({ item }: { item: MintaUangHistory }) => (
        <View style={styles.historyItem}>
            <View style={styles.historyLeft}>
                <View style={styles.iconContainer}>
                    <Ionicons name="enter-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.historyInfo}>
                    <Text style={styles.historyNoRef}>{item.noref_2210023}</Text>
                    <Text style={styles.historyDate}>{new Date(item.tglminta_2210023).toLocaleDateString('id-ID')}</Text>
                </View>
            </View>
            <View style={styles.historyRight}>
                <Text style={styles.historyAmount}>Rp {parseFloat(item.jumlahuang_2210023.toString()).toLocaleString('id-ID')}</Text>
                <Text style={[
                    styles.historyStatus,
                    { color: item.stt_2210023 === 'success' ? '#16a34a' : '#ea580c' }
                ]}>
                    {item.stt_2210023}
                </Text>
            </View>
        </View>
    );

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchHistory} colors={[COLORS.primary]} />}
        >
            <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
            <LinearGradient colors={COLORS.gradientPrimary} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Minta Uang</Text>
                <View style={styles.placeholder} />
            </LinearGradient>

            <View style={styles.formContainer}>
                <Text style={styles.label}>Mau minta uang berapa?</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Rp 0"
                    placeholderTextColor="#999"
                    value={jumlah}
                    onChangeText={setJumlah}
                    keyboardType="numeric"
                    autoFocus={!createdRequest}
                />

                <TouchableOpacity
                    onPress={handleBuatPermintaan}
                    disabled={loading}
                    style={{ width: '100%' }}
                >
                    <LinearGradient
                        colors={loading ? ['#fbcfe8', '#fbcfe8'] : COLORS.gradientPrimary}
                        style={styles.submitButton}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.submitButtonText}>Buat Permintaan</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {createdRequest && (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultTitle}>Permintaan Dibuat!</Text>
                    <View style={styles.qrPlaceholder}>
                        <QRCode
                            value={JSON.stringify({
                                type: 'TRANSFER',
                                noref: createdRequest.noref_2210023,
                                jumlah: createdRequest.jumlahuang_2210023,
                                email: userEmail
                            })}
                            size={200}
                        />
                        <Text style={styles.qrText}>Tunjukkan Kode QR ini ke pengirim</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.refContainer}
                        onPress={() => copyToClipboard(createdRequest.noref_2210023)}
                    >
                        <Text style={styles.refLabel}>Kode Referensi</Text>
                        <Text style={styles.refCode}>{createdRequest.noref_2210023}</Text>
                        <Ionicons name="copy-outline" size={20} color="#666" style={{ marginTop: 5 }} />
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.historyContainer}>
                <Text style={styles.sectionTitle}>Riwayat Permintaan</Text>
                <FlatList
                    data={history}
                    keyExtractor={(item) => (item.id ? item.id.toString() : Math.random().toString())}
                    renderItem={renderHistoryItem}
                    scrollEnabled={false}
                    ListEmptyComponent={<Text style={styles.emptyText}>Belum ada riwayat permintaan</Text>}
                />
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
    formContainer: {
        backgroundColor: 'white',
        margin: 20,
        padding: 24,
        borderRadius: 15,
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    input: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.border,
        width: '100%',
        textAlign: 'center',
        paddingBottom: 10,
        marginBottom: 24,
    },
    submitButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultContainer: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 24,
        borderRadius: 15,
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        alignItems: 'center',
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.success,
        marginBottom: 15,
    },
    qrPlaceholder: {
        alignItems: 'center',
        marginBottom: 20,
        padding: 20,
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        width: '100%',
    },
    qrText: {
        marginTop: 10,
        color: '#64748b',
        textAlign: 'center',
    },
    refContainer: {
        alignItems: 'center',
        padding: 10,
        width: '100%',
    },
    refLabel: {
        fontSize: 14,
        color: '#666',
    },
    refCode: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        letterSpacing: 2,
        marginTop: 5,
    },
    historyContainer: {
        marginHorizontal: 20,
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 15,
    },
    historyItem: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    historyLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.cardBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyInfo: {
        justifyContent: 'center',
    },
    historyNoRef: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    historyDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    historyRight: {
        alignItems: 'flex-end',
    },
    historyAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    historyStatus: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
        textTransform: 'capitalize',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20,
    }
});
