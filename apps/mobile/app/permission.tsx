import type { PermissionState } from "@kapas/domain";
import { t } from "@kapas/localization";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { ActionDock } from "../src/components/action-dock";
import { LightTopBar } from "../src/components/navigation/light-top-bar";
import { PrimaryCta } from "../src/components/primary-cta";
import { ScreenNotice } from "../src/components/screen-notice";
import { ScreenShell } from "../src/components/screen-shell";
import { IconBadge } from "../src/components/ui-primitives";
import { useAutoPromptId } from "../src/hooks/use-prompt-playback";
import { isRTL } from "../src/i18n/rtl";
import { expoSpeechService } from "../src/services/expoSpeechService";
import { useLocaleStore } from "../src/stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../src/theme/tokens";
import { localizedTextMetrics } from "../src/theme/urdu-text";

export default function PermissionScreen() {
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const [state, setState] = useState<PermissionState>("undetermined");
  const [loading, setLoading] = useState(false);
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduUi : fontFamily.ui;
  const align = rtl ? "right" : "left";
  const bodyMetrics = localizedTextMetrics(locale, mobileType.body.size, mobileType.body.line);
  const helperMetrics = localizedTextMetrics(locale, mobileType.helper.size, mobileType.helper.line);
  useAutoPromptId("SC-permission");

  return (
    <ScreenShell
      header={<LightTopBar titleKey="permission.title" />}
      footer={
        <ActionDock>
          <View style={{ gap: 10 }}>
            <PrimaryCta labelKey="permission.allow" icon="mic" loading={loading} onPress={() => {
              setLoading(true);
              void expoSpeechService.requestPermission().then((next) => { setState(next); if (next === "granted") { setTimeout(() => router.back(), 500); } }).finally(() => setLoading(false));
            }} />
            <PrimaryCta labelKey="permission.notNow" tone="secondary" onPress={() => router.back()} />
          </View>
        </ActionDock>
      }
    >
      <View style={{ alignItems: "center", paddingVertical: 12 }}>
        <IconBadge icon="mic" tone="teal" size={88} />
      </View>
      <Text
        style={{
          color: semanticColors.textPrimary,
          fontFamily: family,
          textAlign: align,
          ...bodyMetrics,
        }}
      >
        {t(locale, "permission.body")}
      </Text>
      <View style={{ gap: 14 }}>
        {(["permission.local", "permission.optional", "permission.control"] as const).map((key) => (
          <View key={key} style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "flex-start", gap: 12 }}>
            <IconBadge icon="checkmark" tone="green" size={32} />
            <Text style={{ flex: 1, color: semanticColors.textPrimary, fontFamily: family, textAlign: align, ...helperMetrics }}>{t(locale, key)}</Text>
          </View>
        ))}
      </View>
      {state === "granted" ? <ScreenNotice messageKey="permission.granted" /> : null}
      {state === "denied" ? <ScreenNotice messageKey="permission.denied" tone="error" /> : null}
    </ScreenShell>
  );
}
