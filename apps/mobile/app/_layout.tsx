import { Ionicons } from "@expo/vector-icons";
import { Gulzar_400Regular } from "@expo-google-fonts/gulzar";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  NotoNaskhArabic_400Regular,
  NotoNaskhArabic_500Medium,
  NotoNaskhArabic_600SemiBold,
  NotoNaskhArabic_700Bold,
} from "@expo-google-fonts/noto-naskh-arabic";
import { NotoNastaliqUrdu_600SemiBold } from "@expo-google-fonts/noto-nastaliq-urdu";
import NetInfo from "@react-native-community/netinfo";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, AppState, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { configureNativeLayoutDirection } from "../src/i18n/native-layout-direction";
import { AppErrorBoundary } from "../src/providers/error-boundary";
import { QueryProvider } from "../src/providers/query-provider";
import { imagePreloadService } from "../src/services/imagePreloadService";
import { promptAudioService } from "../src/services/promptAudioService";
import { syncPushRegistrationsForRegistry } from "../src/services/pushRegistrationService";
import { registerSyncBackgroundTask } from "../src/services/syncBackgroundTask";
import { useConnectivityStore } from "../src/stores/connectivityStore";
import { useLocaleStore } from "../src/stores/locale-store";
import { useVoiceGuidanceStore } from "../src/stores/voiceGuidanceStore";
import { semanticColors } from "../src/theme/tokens";

configureNativeLayoutDirection();

export default function RootLayout() {
  const [criticalImagesReady, setCriticalImagesReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoNaskhArabic_400Regular,
    NotoNaskhArabic_500Medium,
    NotoNaskhArabic_600SemiBold,
    NotoNaskhArabic_700Bold,
    NotoNastaliqUrdu_600SemiBold,
    Gulzar_400Regular,
    ...Ionicons.font,
  });
  const hydrated = useLocaleStore((s) => s.hydrated);
  const hydrate = useLocaleStore((s) => s.hydrate);
  const connectivityHydrated = useConnectivityStore((s) => s.hydrated);
  const hydrateConnectivity = useConnectivityStore((s) => s.hydrate);
  const voiceGuidanceHydrated = useVoiceGuidanceStore((s) => s.hydrated);
  const hydrateVoiceGuidance = useVoiceGuidanceStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
    void hydrateConnectivity();
    void hydrateVoiceGuidance();
  }, [hydrate, hydrateConnectivity, hydrateVoiceGuidance]);

  useEffect(() => {
    void registerSyncBackgroundTask().catch(() => undefined);
    void syncPushRegistrationsForRegistry().catch(() => undefined);
    const unsubscribe = NetInfo.addEventListener((network) => {
      const available = network.isConnected === true && network.isInternetReachable !== false;
      useConnectivityStore.getState().setNetworkAvailable(available);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let mounted = true;
    void imagePreloadService.preloadCritical().finally(() => {
      if (!mounted) {
        return;
      }
      setCriticalImagesReady(true);
      imagePreloadService.warmNonCritical();
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        void promptAudioService.stop();
      } else {
        void useConnectivityStore.getState().processQueue();
      }
    });
    return () => subscription.remove();
  }, []);

  if (!hydrated || !connectivityHydrated || !voiceGuidanceHydrated || !criticalImagesReady || (!fontsLoaded && !fontError)) {
    return (
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: semanticColors.pageWorker }}
      >
        <ActivityIndicator color={semanticColors.actionPrimary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AppErrorBoundary>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: semanticColors.pageWorker },
            }}
          />
        </AppErrorBoundary>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
