import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer, DefaultTheme as NavLightTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { useColorScheme, View, ActivityIndicator, StyleSheet } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { darkTheme, lightTheme, palette } from './src/ui/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SnackbarHost } from './src/ui/SnackbarHost';
import { getDatabase } from './src/db/database';
import { ensureStorageReady } from './src/services/fileStorageService';

export default function App() {
  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';
  const paperTheme = isDark ? darkTheme : lightTheme;

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [bootstrapReady, setBootstrapReady] = useState(false);

  useEffect(() => {
    (async () => {
      await Promise.all([getDatabase(), ensureStorageReady()]);
      setBootstrapReady(true);
    })().catch((err) => {
      console.warn('Bootstrap error', err);
      setBootstrapReady(true);
    });
  }, []);

  if (!fontsLoaded || !bootstrapReady) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={palette.primary} size="large" />
      </View>
    );
  }

  const navigationTheme = isDark
    ? { ...NavDarkTheme, colors: { ...NavDarkTheme.colors, background: paperTheme.colors.background, card: paperTheme.colors.surface, primary: paperTheme.colors.primary } }
    : { ...NavLightTheme, colors: { ...NavLightTheme.colors, background: paperTheme.colors.background, card: paperTheme.colors.surface, primary: paperTheme.colors.primary } };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <NavigationContainer theme={navigationTheme}>
            <RootNavigator />
            <SnackbarHost />
            <StatusBar style={isDark ? 'light' : 'dark'} />
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface },
});
