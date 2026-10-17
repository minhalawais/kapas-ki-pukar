import { Ionicons } from "@expo/vector-icons";
import { t } from "@kapas/localization";
import { ActivityIndicator, Text, View } from "react-native";

import { PrimaryCta } from "../../../components/primary-cta";
import { useLocaleStore } from "../../../stores/localeStore";
import { fontFamily, mobileType, radiusUsage, semanticColors } from "../../../theme/tokens";

export type LocationCaptureStatus = "idle" | "locating" | "detected" | "denied" | "error";

interface Props {
  status: LocationCaptureStatus;
  address?: string;
  onRequest: () => void;
  onConfirm: () => void;
  onManual: () => void;
}

export function LocationCapture({ status, address, onRequest, onConfirm, onManual }: Props) {
  const locale = useLocaleStore((state) => state.locale);
  const family = locale === "ur" ? fontFamily.urduUi : fontFamily.ui;

  return (
    <View style={{ gap: 14 }}>
      <View style={{ minHeight: 156, borderRadius: radiusUsage.mobileCard, backgroundColor: semanticColors.aiSurface, borderWidth: 1, borderColor: semanticColors.border, alignItems: "center", justifyContent: "center", gap: 10, padding: 18 }}>
        {status === "locating" ? <ActivityIndicator size="large" color={semanticColors.actionPrimary} /> : (
          <Ionicons name={status === "detected" ? "location" : "navigate-circle"} size={52} color={semanticColors.actionPrimary} />
        )}
        <Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.body.size, lineHeight: mobileType.body.line, fontFamily: family, textAlign: "center" }}>
          {status === "locating" ? t(locale, "grievance.where.locating") : status === "detected" ? address : t(locale, "grievance.where.permissionNote")}
        </Text>
      </View>
      {status === "denied" || status === "error" ? (
        <Text style={{ color: semanticColors.critical, fontSize: mobileType.caption.size, lineHeight: mobileType.caption.line, fontFamily: family, textAlign: locale === "ur" ? "right" : "left" }}>
          {t(locale, status === "denied" ? "grievance.where.denied" : "grievance.where.locationError")}
        </Text>
      ) : null}
      {status === "detected" ? (
        <PrimaryCta labelKey="grievance.where.correct" icon="checkmark-circle" onPress={onConfirm} />
      ) : (
        <PrimaryCta labelKey="grievance.where.useCurrent" icon="locate" loading={status === "locating"} disabled={status === "locating"} onPress={onRequest} />
      )}
      <PrimaryCta labelKey="grievance.where.enterManual" icon="create-outline" tone="secondary" onPress={onManual} />
    </View>
  );
}
