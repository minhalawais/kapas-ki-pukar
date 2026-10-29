import { Linking, Pressable, Text, View } from "react-native";

import { fontFamily, layout, semanticColors } from "../theme/tokens";

export function AppAttributionFooter({
  stickToBottom = false,
  hideDivider = false,
  marginTop,
}: {
  stickToBottom?: boolean;
  hideDivider?: boolean;
  marginTop?: number;
}) {
  const openWebsite = () => {
    void Linking.openURL("https://fruitofsustainability.com");
  };

  return (
    <View
      style={{
        alignSelf: "stretch",
        alignItems: "center",
        marginTop: typeof marginTop === "number" ? marginTop : (stickToBottom ? "auto" : 18),
        paddingHorizontal: layout.mobilePagePaddingX,
        paddingTop: hideDivider ? 0 : 4,
        paddingBottom: stickToBottom ? 4 : 0,
        gap: 7,
      }}
    >
      {hideDivider ? null : (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={{
            width: 44,
            height: 2,
            borderRadius: 1,
            backgroundColor: semanticColors.borderEssential,
          }}
        />
      )}
      <Text
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
        style={{
          color: semanticColors.textSecondary,
          fontFamily: fontFamily.ui,
          fontSize: 11.5,
          lineHeight: 17,
          textAlign: "center",
          maxWidth: 330,
        }}
      >
        Powered by{" "}
        <Text
          accessibilityRole="link"
          accessibilityLabel="Fruit of Sustainability website"
          onPress={openWebsite}
          style={{ color: "#244A8F", fontFamily: fontFamily.uiSemibold }}
        >
          Fruit of Sustainability (SMC-Private) Limited
        </Text>
      </Text>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Privacy policy"
        hitSlop={8}
        onPress={() => void Linking.openURL("https://kapaskipukar.com/privacy")}
      >
        <Text
          style={{
            color: semanticColors.actionPrimary,
            fontFamily: fontFamily.uiSemibold,
            fontSize: 11.5,
            lineHeight: 17,
            textDecorationLine: "underline",
          }}
        >
          Privacy policy
        </Text>
      </Pressable>
    </View>
  );
}
