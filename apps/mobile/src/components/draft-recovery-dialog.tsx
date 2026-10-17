import { Ionicons } from "@expo/vector-icons";
import { t } from "@kapas/localization";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { useReducedMotion } from "../hooks/use-reduced-motion";
import { isRTL } from "../i18n/rtl";
import { useLocaleStore } from "../stores/localeStore";
import { fontFamily, mobileType, radiusUsage, semanticColors } from "../theme/tokens";
import { localizedTextMetrics } from "../theme/urdu-text";

import { PrimaryCta } from "./primary-cta";

interface Props {
  visible: boolean;
  onResume: () => void;
  onNotNow: () => void;
  onDiscard: () => Promise<void>;
  discarding?: boolean;
  discardError?: boolean;
}

export function DraftRecoveryDialog({
  visible,
  onResume,
  onNotNow,
  onDiscard,
  discarding,
  discardError,
}: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const [confirming, setConfirming] = useState(false);
  const reducedMotion = useReducedMotion();
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;
  const align = isRTL(locale) ? "right" : "left";
  const titleMetrics = localizedTextMetrics(locale, mobileType.h1.size, mobileType.h1.line, "heading");
  const bodyMetrics = localizedTextMetrics(locale, mobileType.body.size, mobileType.body.line);
  const helperMetrics = localizedTextMetrics(locale, mobileType.helper.size, mobileType.helper.line);
  const buttonMetrics = localizedTextMetrics(locale, mobileType.button.size, mobileType.button.line);

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reducedMotion ? "none" : "fade"}
      accessibilityViewIsModal
      onRequestClose={() => {
        if (confirming) setConfirming(false);
        else onNotNow();
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(23, 35, 30, 0.55)",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <View
          accessibilityRole="alert"
          style={{
            backgroundColor: semanticColors.surface,
            borderRadius: radiusUsage.mobileCard,
            borderWidth: 1,
            borderColor: semanticColors.borderEssential,
            padding: 20,
            gap: 16,
          }}
        >
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: confirming ? semanticColors.criticalSurface : semanticColors.progressSurface, alignItems: "center", justifyContent: "center", alignSelf: isRTL(locale) ? "flex-end" : "flex-start" }}>
            <Ionicons name={confirming ? "trash" : "document-text"} size={28} color={confirming ? semanticColors.critical : semanticColors.warningText} />
          </View>
          <Text
            style={{
              color: semanticColors.textPrimary,
              fontWeight: "700",
              fontFamily: family,
              textAlign: align,
              ...titleMetrics,
            }}
          >
            {t(locale, confirming ? "draft.discardConfirmTitle" : "draft.title")}
          </Text>
          <Text
            style={{
              color: semanticColors.textPrimary,
              fontFamily: family,
              textAlign: align,
              ...bodyMetrics,
            }}
          >
            {t(locale, confirming ? "draft.discardConfirmBody" : "draft.body")}
          </Text>
          {discardError ? (
            <Text
              style={{
                color: semanticColors.textPrimary,
                fontFamily: family,
                textAlign: align,
                ...helperMetrics,
              }}
            >
              {t(locale, "common.error")}
            </Text>
          ) : null}
          {confirming ? (
            <>
              <PrimaryCta
                labelKey="draft.keep"
                disabled={discarding}
                onPress={() => setConfirming(false)}
              />
              <PrimaryCta labelKey="draft.discard" tone="danger" icon="trash" disabled={discarding} loading={discarding} onPress={() => { void onDiscard().then(() => setConfirming(false)); }} />
            </>
          ) : (
            <>
              <PrimaryCta labelKey="draft.resume" icon="arrow-forward-circle" onPress={onResume} />
              <Pressable
                onPress={onNotNow}
                accessibilityRole="button"
                accessibilityLabel={t(locale, "draft.notNow")}
                style={({ pressed }) => ({
                  minHeight: 56,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    color: semanticColors.textPrimary,
                    fontFamily: family,
                    ...buttonMetrics,
                  }}
                >
                  {t(locale, "draft.notNow")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setConfirming(true)}
                accessibilityRole="button"
                accessibilityLabel={t(locale, "draft.discard")}
                style={({ pressed }) => ({
                  minHeight: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    color: semanticColors.textSecondary,
                    fontFamily: family,
                    textDecorationLine: "underline",
                    ...helperMetrics,
                  }}
                >
                  {t(locale, "draft.discard")}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
