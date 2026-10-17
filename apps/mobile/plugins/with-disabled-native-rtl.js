const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");

/**
 * Keep Android's native layout direction stable. The app supports changing its
 * language at runtime and applies Urdu text direction and component ordering in
 * React Native, so system-level RTL mirroring would reverse those layouts twice.
 */
module.exports = function withDisabledNativeRtl(config) {
  return withAndroidManifest(config, (pluginConfig) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      pluginConfig.modResults,
    );

    application.$["android:supportsRtl"] = "false";
    return pluginConfig;
  });
};
