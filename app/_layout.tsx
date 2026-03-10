import { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import * as RNIap from 'react-native-iap';
import { initializeDatabase } from '../db/database';
import { getSetting } from '../db/settingsQueries';
import { useRoutineStore } from '../store/useRoutineStore';
import { useWaterStore } from '../store/useWaterStore';
import { useExerciseStore } from '../store/useExerciseStore';
import { useInsightStore } from '../store/useInsightStore';
import { useSupporterStore } from '../store/useSupporterStore';
import { requestPermissions } from '../utils/notificationService';
import { Colors } from '../constants/theme';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import Toast from '../components/Toast';

function AppContent() {
  const { setThemeId } = useTheme();
  const loadRoutines = useRoutineStore((s) => s.loadRoutines);
  const loadTodaysDay = useRoutineStore((s) => s.loadTodaysDay);
  const loadWaterToday = useWaterStore((s) => s.loadToday);
  const loadWaterSettings = useWaterStore((s) => s.loadSettings);
  const loadExercises = useExerciseStore((s) => s.loadExercises);
  const generateInsights = useInsightStore((s) => s.generateAndLoad);
  const loadSupporterStatus = useSupporterStore((s) => s.loadStatus);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Init IAP connection (no-op if Play Store unavailable)
    RNIap.initConnection().catch(() => { });

    initializeDatabase()
      .then(() => {
        loadWaterSettings();
        loadWaterToday();
        loadExercises();

        // Load supporter status and apply saved theme instantly
        loadSupporterStatus();
        const supporterStatus = useSupporterStore.getState().status;
        if (supporterStatus?.activeThemeId) {
          setThemeId(supporterStatus.activeThemeId);
        }

        const done = getSetting('onboarding_complete');
        if (done !== '1') {
          router.replace('/onboarding');
        } else {
          loadRoutines();
          loadTodaysDay();
          generateInsights();
        }

        // Request notification permissions once on first launch
        const permAsked = getSetting('notifications_permission_asked');
        if (permAsked !== '1') {
          requestPermissions().catch(() => { });
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to initialize database:', error);
      });

    // Handle notification tap — navigate to the relevant screen
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const id = response.notification.request.identifier;
        if (id === 'workout-active-ongoing') {
          router.push('/workout/active');
        } else if (id.startsWith('rest-timer')) {
          router.push('/workout/active');
        } else if (id.startsWith('workout-')) {
          router.push('/(tabs)');
        } else if (id.startsWith('water-')) {
          router.push('/water');
        } else if (id.startsWith('weight')) {
          router.push('/bodyweight');
        }
      });

    return () => {
      RNIap.endConnection().catch(() => { });
      responseListener.current?.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor={Colors.background} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="workout/active" />
        <Stack.Screen name="workout/summary" />
        <Stack.Screen name="routines/builder" />
        <Stack.Screen name="routines/day-editor" />
        <Stack.Screen name="routines/[id]" />
        <Stack.Screen name="history/[id]" />
        <Stack.Screen name="bodyweight/index" />
        <Stack.Screen name="water/index" />
        <Stack.Screen name="exercises/index" />
        <Stack.Screen name="settings/backup" />
        <Stack.Screen name="settings/notifications" />
        <Stack.Screen name="settings/supporter" />
        <Stack.Screen name="rex" />
      </Stack>
      <Toast />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
