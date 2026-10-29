import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { useLocaleStore } from "../stores/locale-store";

const DEVICE_INSTALL_KEY = "kapas.device.install.id";

type PushNativeModules = {
  Device: typeof import("expo-device");
  Notifications: typeof import("expo-notifications");
};

let pushNativeModules: PushNativeModules | null | undefined;

async function loadPushNativeModules(): Promise<PushNativeModules | null> {
  if (pushNativeModules !== undefined) return pushNativeModules;
  try {
    const [Device, Notifications] = await Promise.all([
      import("expo-device"),
      import("expo-notifications"),
    ]);
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    pushNativeModules = { Device, Notifications };
  } catch {
    pushNativeModules = null;
  }
  return pushNativeModules;
}

async function deviceInstallId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_INSTALL_KEY);
  if (existing) return existing;
  const id = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_INSTALL_KEY, id, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return id;
}

function easProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId;
}

export async function obtainExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  const nativeModules = await loadPushNativeModules();
  if (!nativeModules) return null;
  const { Device, Notifications } = nativeModules;
  if (!Device.isDevice) return null;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;
  const projectId = easProjectId();
  if (!projectId) return null;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export async function pushRegistrationPayload(): Promise<{
  expoPushToken: string;
  platform: "ios" | "android" | "web";
  locale: string;
  deviceInstallId: string;
  requestId: string;
} | null> {
  const expoPushToken = await obtainExpoPushToken();
  if (!expoPushToken) return null;
  const locale = useLocaleStore.getState().locale ?? "en";
  return {
    expoPushToken,
    platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web",
    locale,
    deviceInstallId: await deviceInstallId(),
    requestId: Crypto.randomUUID(),
  };
}
