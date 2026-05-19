import '../global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../stores/auth.store';
import { useOnboardingStore } from '../stores/onboarding.store';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
    mutations: {
      retry: 1,
    },
  },
});

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { isComplete: onboardingComplete } = useOnboardingStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/onboarding');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="settings"
        options={{ presentation: 'modal', headerShown: true, title: 'Ustawienia' }}
      />
      <Stack.Screen
        name="tax-reserves"
        options={{ presentation: 'card', headerShown: true, title: 'Rezerwy podatkowe' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const { loadFromStorage } = useAuthStore();
  const { loadStatus } = useOnboardingStore();

  useEffect(() => {
    Promise.all([loadFromStorage(), loadStatus()]);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <RootLayoutNav />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
