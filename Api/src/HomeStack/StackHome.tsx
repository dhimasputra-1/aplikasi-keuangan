import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../HomeStack/HomeScreen';
import MasukUangPage from './MasukUangPage';
import AddKasMasuk from './AddKasMasuk';
import DetailKasMasuk from './DetailKasMasuk';
import KasKeluarPage from './KasKeluarPage';
import AddKasKeluar from './AddKasKeluar';
import DetailKasKeluar from './DetailKasKeluar';
import KirimUangScreen from './KirimUangScreen';
import RiwayatTransferScreen from './RiwayatTransferScreen';
import DetailTransferScreen from './DetailTransferScreen';
import ScanQrScreen from '../ScanQrScreen';

import MintaUangScreen from './MintaUangScreen';

const Stack = createNativeStackNavigator();

export default function StackHome() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomePage" component={HomeScreen} />
      <Stack.Screen name="MasukUangPage" component={MasukUangPage} />
      <Stack.Screen name="AddKasMasuk" component={AddKasMasuk} />
      <Stack.Screen name="DetailKasMasuk" component={DetailKasMasuk} />
      <Stack.Screen name="KasKeluarPage" component={KasKeluarPage} />
      <Stack.Screen name="AddKasKeluar" component={AddKasKeluar} />
      <Stack.Screen name="DetailKasKeluar" component={DetailKasKeluar} />
      <Stack.Screen name="KirimUang" component={KirimUangScreen} />
      <Stack.Screen name="MintaUang" component={MintaUangScreen} />
      <Stack.Screen name="ScanQr" component={ScanQrScreen} />
      <Stack.Screen name="RiwayatTransfer" component={RiwayatTransferScreen} />
      <Stack.Screen name="DetailTransfer" component={DetailTransferScreen} />
    </Stack.Navigator>
  );
}
