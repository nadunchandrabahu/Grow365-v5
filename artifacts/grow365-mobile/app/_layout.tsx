import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColors } from '@/hooks/useColors';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import {
  cancelDailyReminder,
  isValidReminderTime,
  isValidTimezone,
  reconcileDailyReminder,
} from '@/lib/reminders';

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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function notificationTarget(response: Notifications.NotificationResponse | null | undefined): string | null {
  const data = response?.notification.request.content.data;
  if (!data || typeof data !== 'object') return null;
  const url = (data as { url?: unknown }).url;
  if (url === '/today') return url;
  if (typeof url === 'string' && /^\/devotional\/[A-Za-z0-9-]{1,100}$/.test(url)) return url;
  return null;
}

function RootLayoutNav() {
  const colors = useColors();
  const router = useRouter();
  const segments = useSegments();
  const { session, loading } = useAuth();
  const profileQuery = useProfile(session?.user.id);
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const [notificationsReady, setNotificationsReady] = useState(false);
  const pendingTargetRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const target = notificationTarget(response);
      if (!target) return;
      pendingTargetRef.current = target;
      setPendingTarget(target);
    });
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!mounted) return;
      const target = notificationTarget(response);
      if (target) {
        pendingTargetRef.current = target;
        setPendingTarget(target);
      }
      setNotificationsReady(true);
    }).catch(() => {
      if (mounted) setNotificationsReady(true);
    });
    return () => {
      mounted = false;
      responseSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (loading || !notificationsReady) return;

    const firstSegment = segments[0];
    const isRecovery = firstSegment === 'update-password';
    const isPublic =
      !firstSegment ||
      firstSegment === 'sign-in' ||
      firstSegment === 'sign-up' ||
      firstSegment === 'reset-password';

    if (session && pendingTarget) {
      if (profileQuery.isLoading) return;
      if (!profileQuery.data?.onboarded_at) {
        if (firstSegment !== 'setup') router.replace('/setup');
        return;
      }
      pendingTargetRef.current = null;
      setPendingTarget(null);
      router.replace(pendingTarget as '/today');
      void Notifications.clearLastNotificationResponseAsync().catch(() => {});
    } else if (session && isPublic && !isRecovery) {
      if (profileQuery.isLoading) return;
      router.replace(profileQuery.data?.onboarded_at ? '/(tabs)' : '/setup');
    } else if (!session && !isPublic && !isRecovery) {
      router.replace('/');
    }
  }, [loading, notificationsReady, pendingTarget, profileQuery.data?.onboarded_at, profileQuery.isLoading, router, segments, session]);

  useEffect(() => {
    const reconcile = () => {
      // Do not interpret an in-flight auth/profile lookup as a missing or
      // disabled profile. A failed lookup is also left untouched so a
      // transient network error cannot remove a valid native schedule.
      if (
        loading ||
        !session ||
        profileQuery.isLoading ||
        profileQuery.isFetching ||
        !profileQuery.isFetched ||
        profileQuery.isError
      ) return;
      const profile = profileQuery.data;
      if (
        !profile ||
        !profile.reminder_enabled ||
        !profile.reminder_time ||
        !isValidReminderTime(profile.reminder_time) ||
        !isValidTimezone(profile.timezone)
      ) {
        void cancelDailyReminder().catch(() => {
          // Settings is the user-facing place for native scheduling errors.
        });
        return;
      }
      void reconcileDailyReminder(profile.reminder_enabled, profile.reminder_time, profile.timezone).catch(() => {
        // Settings is the user-facing place for native scheduling errors.
      });
    };
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') reconcile();
    });
    if (AppState.currentState === 'active') reconcile();
    return () => subscription.remove();
  }, [loading, profileQuery.data, profileQuery.isError, profileQuery.isFetching, profileQuery.isFetched, profileQuery.isLoading, session]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

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
      <Stack.Screen name="update-password" options={{ title: 'Choose New Password' }} />
      <Stack.Screen name="setup" options={{ headerShown: false }} />
      <Stack.Screen name="today" options={{ title: 'Today' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="devotional/past" options={{ title: 'Past Devotionals' }} />
      <Stack.Screen name="devotional/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="journal/[id]" options={{ title: 'Private Journal' }} />
      <Stack.Screen name="groups/create" options={{ title: 'Create Group' }} />
      <Stack.Screen name="groups/join" options={{ title: 'Join Group' }} />
      <Stack.Screen name="groups/[id]" options={{ title: 'Group' }} />
      <Stack.Screen name="subscription" options={{ title: 'Subscription' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy policy' }} />
      <Stack.Screen name="terms" options={{ title: 'Terms of use' }} />
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
            <AuthProvider>
              <KeyboardProvider>
                <StatusBar style="dark" />
                <RootLayoutNav />
              </KeyboardProvider>
            </AuthProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}