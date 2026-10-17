import { Image, View } from "react-native";

import WELCOME_VISUAL from "../../assets/illustrations/welcome-voice-worker.png";

export function WelcomeIllustration() {
  return (
    <View
      accessible={false}
      style={{
        width: "100%",
        aspectRatio: 1.2,
        overflow: "hidden",
        borderRadius: 8,
        backgroundColor: "#E7F4F1",
      }}
    >
      <Image source={WELCOME_VISUAL} resizeMode="contain" style={{ width: "100%", height: "100%" }} />
    </View>
  );
}
