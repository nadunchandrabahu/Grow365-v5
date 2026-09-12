import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColors } from '@/hooks/useColors';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts as useInterFonts,
} from '@expo-google-fonts/inter';
import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  useFonts as useFrauncesFonts,
} from '@expo-google-fonts/fraunces';
import {
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  useFonts as useLoraFonts,
} from '@expo-google-fonts/lora';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  useFonts as useMonoFonts,
} from '@expo-google-fonts/ibm-plex-mono';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const colors = useColors();
  return (
    <Stack 
      screenOptions={{ 
        headerBackTitle: 'Back',
        headerTintColor: colors.foreground,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontFamily: 'Fraunces_600SemiBold' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" options={{ title: 'Sign In', headerBackTitle: 'Welcome' }} />
      <Stack.Screen name="sign-up" options={{ title: 'Sign Up', headerBackTitle: 'Welcome' }} />
      <Stack.Screen name="reset-password" options={{ title: 'Reset Password' }} />
      <Stack.Screen name="setup" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="devotional/past" options={{ title: 'Past Devotionals' }} />
      <Stack.Screen name="devotional/[id]" options={{ title: 'Devotional', headerBackTitle: 'Back' }} />
      <Stack.Screen name="groups/create" options={{ title: 'Create Group' }} />
      <Stack.Screen name="groups/join" options={{ title: 'Join Group' }} />
      <Stack.Screen name="groups/[id]" options={{ title: 'Group' }} />
      <Stack.Screen name="subscription" options={{ title: 'Subscription' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [interLoaded, interError] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [frauncesLoaded, frauncesError] = useFrauncesFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });
  const [loraLoaded, loraError] = useLoraFonts({
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
  });
  const [monoLoaded, monoError] = useMonoFonts({
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  const fontsLoaded = interLoaded && frauncesLoaded && loraLoaded && monoLoaded;
  const fontError = interError || frauncesError || loraError || monoError;

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}