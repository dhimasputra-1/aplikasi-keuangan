import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ToastAndroid,
    Image,
    StatusBar,
    Dimensions,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { ipAddress } from '../../IpPublic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SHADOWS } from '../constants/theme';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function FormGantiFoto({ navigation }: { navigation: any }) {
    const [loadingButton, setLoadingButton] = useState(false);
    const [pic, setPic] = useState<string | null>(null);
    const [uriImage, setUriImage] = useState<string | undefined>();
    const [typeImage, setTypeImage] = useState<string | undefined>();
    const [fileNameImage, setFileNameImage] = useState<string | undefined>();

    const setToastPesan = (pesan: string) => {
        ToastAndroid.showWithGravity(pesan, ToastAndroid.SHORT, ToastAndroid.CENTER);
    };

    const ambilDariKamera = async () => {
        try {
            const result = await launchCamera({
                mediaType: 'photo',
                includeBase64: false,
            });

            if (result.didCancel) {
                setToastPesan('Gambar batal dipilih');
            } else if (result.errorCode === 'permission') {
                setToastPesan('Tidak ada izin');
            } else if (result.errorCode === 'others') {
                setToastPesan(result.errorMessage || 'Terjadi kesalahan');
            } else if (result.assets && result.assets[0] && result.assets[0].fileSize && result.assets[0].fileSize > 5242880) {
                setToastPesan('Ukuran gambar terlalu besar');
            } else if (result.assets && result.assets[0]) {
                setPic(result.assets[0].uri || null);
                setUriImage(result.assets[0].uri);
                setTypeImage(result.assets[0].type);
                setFileNameImage(result.assets[0].fileName);
            }
        } catch (error) {
            setToastPesan('Terjadi kesalahan saat mengambil gambar');
        }
    };

    const pilihDariGaleri = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                includeBase64: false,
            });

            if (result.didCancel) {
                setToastPesan('Gambar batal dipilih');
            } else if (result.errorCode === 'permission') {
                setToastPesan('Tidak ada izin');
            } else if (result.errorCode === 'others') {
                setToastPesan(result.errorMessage || 'Terjadi kesalahan');
            } else if (result.assets && result.assets[0] && result.assets[0].fileSize && result.assets[0].fileSize > 5242880) {
                setToastPesan('Ukuran gambar terlalu besar');
            } else if (result.assets && result.assets[0]) {
                setPic(result.assets[0].uri || null);
                setUriImage(result.assets[0].uri);
                setTypeImage(result.assets[0].type);
                setFileNameImage(result.assets[0].fileName);
            }
        } catch (error) {
            setToastPesan('Terjadi kesalahan saat memilih gambar');
        }
    };

    const uploadImageToApi = async () => {
        if (pic == null || pic == '') {
            setToastPesan('Pilih gambar terlebih dahulu');
            return;
        }

        setLoadingButton(true);

        try {
            const token = await AsyncStorage.getItem('user_token');

            if (!token) {
                setToastPesan('Token tidak ditemukan. Silakan login kembali');
                setLoadingButton(false);
                return;
            }

            let normalizedUri = uriImage;
            if (normalizedUri && normalizedUri.startsWith('file://')) {
                normalizedUri = normalizedUri;
            }

            const formData = new FormData();
            formData.append('photo', {
                uri: normalizedUri,
                type: typeImage || 'image/jpeg',
                name: fileNameImage || `photo_${Date.now()}.jpg`,
            } as any);

            const response = await fetch(`${ipAddress}/update-photo`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            let res;
            const responseText = await response.text();

            try {
                res = JSON.parse(responseText);
            } catch (parseError) {
                setToastPesan('Server mengembalikan response yang tidak valid');
                setLoadingButton(false);
                return;
            }

            if (!response.ok) {
                const errorMsg = res.message || res.error || 'Gagal mengupload gambar';
                Alert.alert('Gagal Upload', errorMsg);
                setLoadingButton(false);
                return;
            }

            setToastPesan(res.message || 'Foto berhasil diupload');

            try {
                const extractAvatar = (obj: any): string | null => {
                    if (!obj) return null;
                    if (typeof obj === 'string') {
                        const s = obj as string;
                        if (s.includes('/storage/') || s.includes('/photos/') || s.match(/\.(jpg|jpeg|png|gif)$/i)) {
                            return s;
                        }
                        return null;
                    }
                    if (typeof obj === 'object') {
                        for (const key of Object.keys(obj)) {
                            const val = obj[key];
                            const result = extractAvatar(val);
                            if (result) return result;
                        }
                    }
                    return null;
                };

                let newAvatar: string | null = null;
                const explicitFields = [
                    res?.user?.avatar,
                    res?.data?.user?.avatar,
                    res?.data?.avatar,
                    res?.avatar,
                    res?.avatar_path,
                    res?.path,
                    res?.file,
                    res?.image,
                ];
                for (const f of explicitFields) {
                    if (typeof f === 'string' && f) {
                        newAvatar = f;
                        break;
                    }
                }

                if (!newAvatar) {
                    newAvatar = extractAvatar(res);
                }

                if (newAvatar) {
                    if (!newAvatar.startsWith('/')) {
                        if (!newAvatar.startsWith('http')) newAvatar = '/' + newAvatar;
                    }

                    const stored = await AsyncStorage.getItem('user_data');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        parsed.avatar = newAvatar;
                        await AsyncStorage.setItem('user_data', JSON.stringify(parsed));
                    } else {
                        const minimal = { avatar: newAvatar };
                        await AsyncStorage.setItem('user_data', JSON.stringify(minimal));
                    }

                    try {
                        const stored = await AsyncStorage.getItem('user_data');
                        let userKey = 'uploaded_avatar';
                        if (stored) {
                            try {
                                const parsed = JSON.parse(stored);
                                const uid = parsed?.id || parsed?.email || parsed?.name || 'unknown';
                                userKey = `uploaded_avatar_${uid}`;
                            } catch (e) {
                                // ignore
                            }
                        }
                        await AsyncStorage.setItem(userKey, newAvatar);
                        await AsyncStorage.setItem('uploaded_avatar', newAvatar);
                    } catch (e) {
                        console.warn('Failed to save uploaded_avatar override:', e);
                    }
                }
            } catch (e) {
                console.warn('Failed to update local user_data with avatar:', e);
            }

            setPic(null);
            setUriImage(undefined);
            setTypeImage(undefined);
            setFileNameImage(undefined);

            setTimeout(() => {
                setLoadingButton(false);
                navigation.goBack();
            }, 1500);
        } catch (error: any) {
            let errorMessage = 'Gagal mengupload gambar';
            if (error.message.includes('Network')) {
                errorMessage = 'Koneksi jaringan bermasalah. Periksa internet Anda';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'Upload timeout. Coba lagi';
            }

            setToastPesan(errorMessage);
            setLoadingButton(false);
        }
    };

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
                        <Icon name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Ganti Foto Profil</Text>
                    <View style={styles.placeholder} />
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.card}>
                    {/* Preview Image */}
                    <View style={styles.imagePreviewContainer}>
                        {pic ? (
                            <Image
                                source={{ uri: pic }}
                                style={styles.imagePreview}
                            />
                        ) : (
                            <View style={styles.placeholderContainer}>
                                <Icon name="image-outline" size={80} color="#cbd5e1" />
                                <Text style={styles.placeholderText}>Belum ada gambar dipilih</Text>
                            </View>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => pilihDariGaleri()}
                        activeOpacity={0.7}
                    >
                        <Icon name="image-outline" size={22} color="white" />
                        <Text style={styles.buttonText}>Pilih dari Galeri</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => ambilDariKamera()}
                        activeOpacity={0.7}
                    >
                        <Icon name="camera-outline" size={22} color="white" />
                        <Text style={styles.buttonText}>Ambil Foto</Text>
                    </TouchableOpacity>

                    {/* Upload Button */}
                    <TouchableOpacity
                        style={[
                            styles.uploadButton,
                            (!pic || loadingButton) && styles.uploadButtonDisabled
                        ]}
                        onPress={uploadImageToApi}
                        disabled={!pic || loadingButton}
                        activeOpacity={0.7}
                    >
                        {loadingButton ? (
                            <Icon name="hourglass-outline" size={22} color="white" />
                        ) : (
                            <>
                                <Icon name="cloud-upload-outline" size={22} color="white" />
                                <Text style={styles.uploadButtonText}>Upload Foto</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
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
    content: {
        flex: 1,
        marginTop: -40,
        paddingHorizontal: 24,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        ...SHADOWS.large,
    },
    imagePreviewContainer: {
        width: '100%',
        height: 280,
        borderRadius: 20,
        backgroundColor: '#f8fafc',
        marginBottom: 24,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 12,
        fontSize: 14,
        color: '#94a3b8',
    },
    button: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        padding: 16,
        marginBottom: 12,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    buttonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 10,
    },
    uploadButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.success,
        padding: 18,
        marginTop: 8,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    uploadButtonDisabled: {
        backgroundColor: '#cbd5e1',
    },
    uploadButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 10,
    },
});