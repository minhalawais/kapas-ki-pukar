/**
 * NativeWind babel preset without react-native-worklets/plugin.
 * That plugin is for Reanimated 4 / Expo SDK 54. This app is Expo 53 + Reanimated 3.
 */
module.exports = function nativewindBabel() {
  return {
    plugins: [
      require("react-native-css-interop/dist/babel-plugin").default,
      [
        "@babel/plugin-transform-react-jsx",
        {
          runtime: "automatic",
          importSource: "react-native-css-interop",
        },
      ],
    ],
  };
};
