import { I18nManager } from "react-native";

/**
 * The app language is selected inside the app and can differ from the device
 * language. Keep React Native's native coordinate system stable and express
 * locale direction explicitly in components so release and development builds
 * render identically without requiring an app restart.
 */
export function configureNativeLayoutDirection(): void {
  I18nManager.allowRTL(false);
  I18nManager.forceRTL(false);
  I18nManager.swapLeftAndRightInRTL(false);
}
