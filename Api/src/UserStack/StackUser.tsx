import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserScreen from './UserScreen';
import ChangePasswordScreen from '../UserStack/ChangePasswordScreen';
import FormGantiFoto from '../UserStack/FormGantiFoto';

export type UserStackParamList = {
  UserScreen: undefined;
  ChangePasswordScreen: undefined;
  FormGantiFoto: undefined;
};

const Stack = createNativeStackNavigator<UserStackParamList>();

export default function StackUser() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserScreen" component={UserScreen} />
      <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
      <Stack.Screen name="FormGantiFoto" component={FormGantiFoto} />
    </Stack.Navigator>
  );
}

