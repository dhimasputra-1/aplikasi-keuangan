import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import HomeScreen from './src/HomeStack/HomeScreen';
import ActivityScreen from './src/ActivityScreen';
import ScanQrScreen from './src/ScanQrScreen';
import ReportScreen from './src/ReportScreen';
import StackHome from './src/HomeStack/StackHome';
import StackUser from './src/UserStack/StackUser';
import Icon from 'react-native-vector-icons/Ionicons';

function MyTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const icons = {
    Home: 'home-outline',
    Activity: 'briefcase-outline',
    Scan: 'qr-code-outline',
    Report: 'document-text-outline',
    User: 'person-outline',
  } as const;

  const activeIcons = {
    Home: 'home',
    Activity: 'briefcase',
    Scan: 'qr-code',
    Report: 'document-text',
    User: 'person',
  } as const;

  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const iconName = (isFocused 
          ? activeIcons[route.name as keyof typeof activeIcons] 
          : icons[route.name as keyof typeof icons]) || 'person-outline';

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
          >
            <Icon
              name={iconName}
              size={24}
              color={isFocused ? '#2596be' : 'gray'}
            />
            <Text style={[styles.label, isFocused ? styles.labelActive : styles.labelInactive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    elevation: 2,
    borderTopColor: '#2596be',
    borderTopWidth: 5,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    backgroundColor: '#f8f9fa',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
  labelActive: {
    color: '#2596be',
  },
  labelInactive: {
    color: 'gray',
  },
});

const Tab = createBottomTabNavigator();

export default function Index() {
  return (
    <Tab.Navigator tabBar={(props) => <MyTabBar {...props} />}>
      <Tab.Screen
        name="Home"
        component={StackHome}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanQrScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="User"
        component={StackUser}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}