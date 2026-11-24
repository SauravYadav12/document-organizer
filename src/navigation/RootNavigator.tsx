import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

import type {
  CaptureStackParamList,
  LibraryStackParamList,
  RootTabParamList,
} from './screens';
import { HomeScreen } from '../features/library/HomeScreen';
import { MonthScreen } from '../features/library/MonthScreen';
import { DocumentDetailScreen } from '../features/document/DocumentDetailScreen';
import { DocumentViewerScreen } from '../features/document/DocumentViewerScreen';
import { MoveDocumentScreen } from '../features/document/MoveDocumentScreen';
import { CaptureScreen } from '../features/capture/CaptureScreen';
import { ConfirmDateScreen } from '../features/capture/ConfirmDateScreen';
import { HistoryScreen } from '../features/history/HistoryScreen';
import { SettingsScreen } from '../subscription/SettingsScreen';
import { palette } from '../ui/theme';

const Tabs = createBottomTabNavigator<RootTabParamList>();
const LibraryStack = createNativeStackNavigator<LibraryStackParamList>();
const CaptureStack = createNativeStackNavigator<CaptureStackParamList>();

function LibraryStackNavigator() {
  return (
    <LibraryStack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <LibraryStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'DocOrg' }}
      />
      <LibraryStack.Screen
        name="Month"
        component={MonthScreen}
        options={({ route }) => ({ title: String(route.params.year) })}
      />
      <LibraryStack.Screen
        name="DocumentDetail"
        component={DocumentDetailScreen}
        options={{ title: '' }}
      />
      <LibraryStack.Screen
        name="MoveDocument"
        component={MoveDocumentScreen}
        options={{ title: 'Move document', presentation: 'modal' }}
      />
      <LibraryStack.Screen
        name="DocumentViewer"
        component={DocumentViewerScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />
      <LibraryStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </LibraryStack.Navigator>
  );
}

function CaptureStackNavigator() {
  return (
    <CaptureStack.Navigator screenOptions={{ headerShown: false }}>
      <CaptureStack.Screen name="Capture" component={CaptureScreen} />
      <CaptureStack.Screen name="ConfirmDate" component={ConfirmDateScreen} />
    </CaptureStack.Navigator>
  );
}

export function RootNavigator() {
  const theme = useTheme();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.onSurfaceVariant,
        tabBarStyle: shouldHideTabBar(route)
          ? { display: 'none' }
          : {
              backgroundColor: theme.colors.surface,
              borderTopColor: palette.outline,
              height: 64,
              paddingBottom: 10,
              paddingTop: 6,
            },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
      })}
    >
      <Tabs.Screen
        name="LibraryTab"
        component={LibraryStackNavigator}
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="folder-multiple" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="CaptureTab"
        component={CaptureStackNavigator}
        options={{
          tabBarLabel: 'Capture',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="camera-plus" color={color} size={size + 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          headerShown: true,
          title: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" color={color} size={size} />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}

function shouldHideTabBar(route: { name: string; state?: { index?: number; routes?: Array<{ name: string }> } }): boolean {
  if (route.name !== 'CaptureTab') return false;
  const nested = route.state;
  if (!nested) return true;
  const inner = nested.routes?.[nested.index ?? 0]?.name;
  return inner === 'Capture' || inner === 'ConfirmDate';
}
