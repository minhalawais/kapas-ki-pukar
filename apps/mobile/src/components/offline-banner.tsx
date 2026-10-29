import { Ionicons } from "@expo/vector-icons";
import { t, type MessageKey } from "@kapas/localization";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import { isRTL } from "../i18n/rtl";
import { expoEvidenceService } from "../services/expoEvidenceService";
import { useConnectivityStore } from "../stores/connectivityStore";
import { useLocaleStore } from "../stores/localeStore";
import { fontFamily, mobileType, radiusUsage, semanticColors } from "../theme/tokens";

const syncErrorMessages: Record<string, MessageKey> = {
  network_unavailable: "offline.error.networkUnavailable",
  not_found: "offline.error.serverIntakeUnavailable",
  validation_failed: "offline.error.validationFailed",
  identity_unavailable: "offline.error.identityUnavailable",
  api_configuration_invalid: "offline.error.configurationInvalid",
  media_unavailable: "offline.error.mediaUnavailable",
  upload_failed: "offline.error.uploadFailed",
  upload_grant_failed: "offline.error.uploadFailed",
  malware_detected: "offline.error.malwareDetected",
  mime_mismatch: "offline.error.mimeMismatch",
};

export function OfflineBanner() {
  const locale = useLocaleStore((s) => s.locale);
  const state = useConnectivityStore((s) => s.state);
  const failedCount = useConnectivityStore((s) => s.failedCount);
  const lastErrorCode = useConnectivityStore((s) => s.lastErrorCode);
  const retryFailed = useConnectivityStore((s) => s.retryFailed);
  const mediaRecovery = useConnectivityStore((s) => s.mediaRecovery);
  const replaceMissingMedia = useConnectivityStore((s) => s.replaceMissingMedia);
  const omitMissingMedia = useConnectivityStore((s) => s.omitMissingMedia);
  const discardFailedReport = useConnectivityStore((s) => s.discardFailedReport);
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;
  const align = isRTL(locale) ? "right" : "left";
  const reconnecting = state === "reconnecting";
  const offline = state === "offline-demo";
  const failed = state === "online" && failedCount > 0;
  const actionableMedia = failed ? mediaRecovery : null;
  const recoveryButtonStyle = ({ pressed }: { pressed: boolean }) => ({
    minHeight: 44,
    justifyContent: "center" as const,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    opacity: recoveryBusy ? 0.45 : pressed ? 0.7 : 1,
  });
  const recoveryTextStyle = {
    color: semanticColors.actionPrimary,
    fontFamily: family,
    fontWeight: "700" as const,
    textAlign: align as "left" | "right",
  };

  const replaceAttachment = async () => {
    if (!mediaRecovery || recoveryBusy) return;
    const replacement = await expoEvidenceService.pickReplacement(mediaRecovery.kind);
    if (!replacement) return;
    setRecoveryBusy(true);
    try {
      await replaceMissingMedia(replacement);
    } finally {
      setRecoveryBusy(false);
    }
  };

  const confirmOmitAttachment = () => {
    if (recoveryBusy) return;
    Alert.alert(
      t(
        locale,
        mediaRecovery?.complaintAccepted
          ? "offline.recovery.omitAcceptedTitle"
          : "offline.recovery.omitTitle",
      ),
      t(
        locale,
        mediaRecovery?.complaintAccepted
          ? "offline.recovery.omitAcceptedBody"
          : "offline.recovery.omitBody",
      ),
      [
        { text: t(locale, "common.cancel"), style: "cancel" },
        {
          text: t(locale, "offline.recovery.sendWithout"),
          onPress: () => {
            setRecoveryBusy(true);
            void omitMissingMedia().finally(() => setRecoveryBusy(false));
          },
        },
      ],
    );
  };

  const confirmDiscard = () => {
    if (recoveryBusy) return;
    Alert.alert(
      t(locale, "offline.recovery.discardTitle"),
      t(locale, "offline.recovery.discardBody"),
      [
        { text: t(locale, "common.cancel"), style: "cancel" },
        {
          text: t(locale, "offline.recovery.discard"),
          style: "destructive",
          onPress: () => {
            setRecoveryBusy(true);
            void discardFailedReport().finally(() => setRecoveryBusy(false));
          },
        },
      ],
    );
  };

  if (!offline && !reconnecting && !failed) {
    return null;
  }

  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: semanticColors.warningSurface,
        borderColor: semanticColors.warning,
        borderWidth: 1,
        borderRadius: radiusUsage.mobileCard,
        padding: 14,
        gap: 8,
      }}
    >
      <View
        style={{
          flexDirection: isRTL(locale) ? "row-reverse" : "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Ionicons
          name={reconnecting ? "sync" : failed ? "alert-circle" : "cloud-offline"}
          size={22}
          color={semanticColors.warningText}
        />
        <Text
          style={{
            flex: 1,
            color: semanticColors.textPrimary,
            fontSize: mobileType.body.size,
            lineHeight: mobileType.body.line,
            fontFamily: family,
            textAlign: align,
          }}
        >
          {t(
            locale,
            reconnecting
              ? "offline.banner.reconnecting"
              : actionableMedia?.complaintAccepted
                ? "offline.banner.evidenceAction"
                : failed
                  ? "offline.banner.failed"
                  : "offline.banner.offline",
          )}
        </Text>
      </View>
      {offline ? (
        <Text
          style={{
            color: semanticColors.textPrimary,
            fontSize: mobileType.helper.size,
            lineHeight: mobileType.helper.line,
            fontFamily: family,
            textAlign: align,
          }}
        >
          {t(locale, "offline.banner.saved")}
        </Text>
      ) : null}
      {reconnecting ? (
        <ActivityIndicator
          color={semanticColors.actionPrimary}
          accessibilityLabel={t(locale, "common.loading")}
        />
      ) : null}
      {actionableMedia ? (
        <View style={{ gap: 2, alignItems: isRTL(locale) ? "flex-start" : "flex-end" }}>
          <Pressable
            disabled={recoveryBusy}
            onPress={() => void replaceAttachment()}
            accessibilityRole="button"
            style={recoveryButtonStyle}
          >
            <Text style={recoveryTextStyle}>{t(locale, "offline.recovery.replace")}</Text>
          </Pressable>
          <Pressable
            disabled={recoveryBusy}
            onPress={confirmOmitAttachment}
            accessibilityRole="button"
            style={recoveryButtonStyle}
          >
            <Text style={recoveryTextStyle}>{t(locale, "offline.recovery.sendWithout")}</Text>
          </Pressable>
          {actionableMedia.canDiscardComplaint ? (
            <Pressable
              disabled={recoveryBusy}
              onPress={confirmDiscard}
              accessibilityRole="button"
              style={recoveryButtonStyle}
            >
              <Text style={[recoveryTextStyle, { color: semanticColors.critical }]}>
                {t(locale, "offline.recovery.discard")}
              </Text>
            </Pressable>
          ) : null}
          {recoveryBusy ? (
            <ActivityIndicator
              color={semanticColors.actionPrimary}
              accessibilityLabel={t(locale, "common.loading")}
            />
          ) : null}
        </View>
      ) : failed ? (
        <Pressable
          onPress={() => void retryFailed()}
          accessibilityRole="button"
          style={{ alignSelf: isRTL(locale) ? "flex-start" : "flex-end", paddingVertical: 6 }}
        >
          <Text
            style={{
              color: semanticColors.actionPrimary,
              fontFamily: family,
              fontWeight: "700",
              textAlign: align,
            }}
          >
            {t(locale, "offline.banner.retry")}
          </Text>
        </Pressable>
      ) : null}
      {failed && lastErrorCode ? (
        <Text
          style={{
            color: semanticColors.textSecondary,
            fontSize: mobileType.helper.size,
            fontFamily: family,
            textAlign: align,
          }}
        >
          {t(locale, syncErrorMessages[lastErrorCode] ?? "offline.error.unknown")}
        </Text>
      ) : null}
    </View>
  );
}
