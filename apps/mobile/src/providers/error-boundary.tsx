import { Ionicons } from "@expo/vector-icons";
import { t } from "@kapas/localization";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { useLocaleStore } from "../stores/locale-store";
import { controlSize, fontFamily, mobileType, semanticColors } from "../theme/tokens";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Mobile error boundary", error, info);
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
  }
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const locale = useLocaleStore((s) => s.locale);
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: semanticColors.pageWorker,
        padding: 20,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
      }}
    >
      <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: semanticColors.criticalSurface, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="alert-circle" size={46} color={semanticColors.critical} />
      </View>
      <Text
        style={{
          color: semanticColors.textPrimary,
          fontSize: mobileType.body.size,
          lineHeight: mobileType.body.line,
          fontFamily: locale === "ur" ? fontFamily.urduSemibold : fontFamily.uiSemibold,
          textAlign: "center",
        }}
      >
        {t(locale, "common.error")}
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        style={{
          width: "100%",
          minHeight: controlSize.mobileCtaHeight,
          backgroundColor: semanticColors.actionPrimary,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: semanticColors.onPrimary,
            fontSize: mobileType.button.size,
            fontFamily: locale === "ur" ? fontFamily.urduSemibold : fontFamily.uiSemibold,
          }}
        >
          {t(locale, "common.retry")}
        </Text>
      </Pressable>
    </View>
  );
}
