import { t } from "@kapas/localization";
import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { PrimaryCta } from "../../../components/primary-cta";
import {
  formatCnic,
  formatPhone,
  isValidCnic,
  isValidPhone,
  normalizeCnic,
  normalizePhone,
} from "../../../services/expoIdentityService";
import { promptAudioService } from "../../../services/promptAudioService";
import { useLocaleStore } from "../../../stores/localeStore";
import { useVoiceGuidanceStore } from "../../../stores/voiceGuidanceStore";
import { fontFamily, mobileType, radiusUsage, semanticColors } from "../../../theme/tokens";

interface Props {
  busy?: boolean;
  error?: boolean;
  onSubmitIdentity: (identity: {
    phone: string;
    cnic?: string;
    privacyMode: "CONF" | "IDEN";
  }) => void;
  onSubmitAnonymous: () => void;
}

export function IdentityGate({ busy, error, onSubmitIdentity, onSubmitAnonymous }: Props) {
  const locale = useLocaleStore((state) => state.locale);
  const voiceGuidanceEnabled = useVoiceGuidanceStore((state) => state.enabled);
  const [mode, setMode] = useState<"choice" | "cnic" | "phone" | "privacy">("choice");
  const [identityKind, setIdentityKind] = useState<"cnic" | "phone">("cnic");
  const [cnic, setCnic] = useState("");
  const [phone, setPhone] = useState("");

  const validCnic = isValidCnic(cnic);
  const validPhone = isValidPhone(phone);
  const isUrdu = locale === "ur";
  const copyFamily = isUrdu ? fontFamily.urduUi : fontFamily.ui;
  const headingFamily = isUrdu ? fontFamily.urduBold : fontFamily.uiBold;
  const textAlign = isUrdu ? "right" : "left";

  useEffect(() => {
    if (mode === "privacy" && locale === "ur" && voiceGuidanceEnabled) {
      void promptAudioService.playPrompt("WF-privacy");
    }
  }, [locale, mode, voiceGuidanceEnabled]);

  const handleSelectMode = (newMode: "cnic" | "phone") => {
    setIdentityKind(newMode);
    setMode(newMode);
    if (locale === "ur" && voiceGuidanceEnabled) {
      void promptAudioService.playPrompt(
        newMode === "cnic" ? "WF-identity-cnic" : "WF-identity-phone",
      );
    }
  };

  const submitWithPrivacy = (privacyMode: "CONF" | "IDEN") => {
    onSubmitIdentity({ phone, ...(identityKind === "cnic" ? { cnic } : {}), privacyMode });
  };

  const renderHeader = (variant: "identity" | "privacy" = "identity") => (
    <View style={{ gap: 12 }}>
      <Text
        style={{
          color: semanticColors.textPrimary,
          fontSize: mobileType.question.size,
          lineHeight: mobileType.question.line,
          fontFamily: headingFamily,
          textAlign,
        }}
      >
        {t(
          locale,
          variant === "privacy" ? "grievance.privacy.prompt" : "grievance.identity.prompt",
        )}
      </Text>
      <Text
        style={{
          color: semanticColors.textPrimary,
          fontSize: mobileType.body.size,
          lineHeight: mobileType.body.line,
          fontFamily: copyFamily,
          textAlign,
        }}
      >
        {t(locale, variant === "privacy" ? "grievance.privacy.body" : "grievance.identity.body")}
      </Text>
    </View>
  );

  if (mode === "choice") {
    return (
      <View style={{ gap: 14 }}>
        {renderHeader()}
        <PrimaryCta
          labelKey="grievance.identity.optionCnic"
          icon="card-outline"
          disabled={busy}
          onPress={() => handleSelectMode("cnic")}
        />
        <PrimaryCta
          labelKey="grievance.identity.optionPhone"
          icon="call-outline"
          tone="secondary"
          disabled={busy}
          onPress={() => handleSelectMode("phone")}
        />
        <PrimaryCta
          labelKey="grievance.identity.continueAnonymous"
          icon="eye-off-outline"
          tone="secondary"
          disabled={busy}
          onPress={onSubmitAnonymous}
        />
        {error ? (
          <Text
            style={{
              color: semanticColors.critical,
              fontSize: mobileType.caption.size,
              lineHeight: mobileType.caption.line,
              fontFamily: copyFamily,
              textAlign,
            }}
          >
            {t(locale, "grievance.identity.saveError")}
          </Text>
        ) : null}
      </View>
    );
  }

  if (mode === "phone") {
    return (
      <View style={{ gap: 14 }}>
        {renderHeader()}
        <TextInput
          value={formatPhone(phone)}
          onChangeText={(value) => setPhone(normalizePhone(value))}
          keyboardType="number-pad"
          maxLength={12}
          placeholder="0300-1234567"
          placeholderTextColor={semanticColors.textSecondary}
          accessibilityLabel={t(locale, "grievance.identity.optionPhone")}
          style={{
            minHeight: 62,
            borderWidth: 1.5,
            borderColor:
              phone.length > 0 && !validPhone
                ? semanticColors.critical
                : semanticColors.borderEssential,
            borderRadius: radiusUsage.mobileCard,
            backgroundColor: semanticColors.surface,
            color: semanticColors.textPrimary,
            fontFamily: fontFamily.mono,
            fontSize: 20,
            textAlign: "center",
            letterSpacing: 0,
            paddingHorizontal: 16,
          }}
        />
        {phone.length > 0 && !validPhone ? (
          <Text
            style={{
              color: semanticColors.critical,
              fontSize: mobileType.caption.size,
              lineHeight: mobileType.caption.line,
              fontFamily: copyFamily,
              textAlign,
            }}
          >
            {t(locale, "grievance.identity.invalidPhone")}
          </Text>
        ) : null}
        {error ? (
          <Text
            style={{
              color: semanticColors.critical,
              fontSize: mobileType.caption.size,
              lineHeight: mobileType.caption.line,
              fontFamily: copyFamily,
              textAlign,
            }}
          >
            {t(locale, "grievance.identity.saveError")}
          </Text>
        ) : null}
        <PrimaryCta
          labelKey="grievance.identity.continuePhone"
          icon="call-outline"
          disabled={!validPhone}
          loading={busy}
          onPress={() => setMode("privacy")}
        />
        <PrimaryCta
          labelKey="grievance.identity.changeOption"
          icon="arrow-back-outline"
          tone="secondary"
          disabled={busy}
          onPress={() => setMode(identityKind === "cnic" ? "cnic" : "choice")}
        />
      </View>
    );
  }

  if (mode === "privacy") {
    return (
      <View style={{ gap: 14 }}>
        {renderHeader("privacy")}
        <PrimaryCta
          labelKey="grievance.identity.keepConfidential"
          icon="person-outline"
          disabled={busy}
          loading={busy}
          onPress={() => submitWithPrivacy("CONF")}
        />
        <PrimaryCta
          labelKey="grievance.identity.allowDisclosure"
          icon="person-outline"
          tone="secondary"
          disabled={busy}
          onPress={() => submitWithPrivacy("IDEN")}
        />
        {error ? (
          <Text
            style={{
              color: semanticColors.critical,
              fontSize: mobileType.caption.size,
              lineHeight: mobileType.caption.line,
              fontFamily: copyFamily,
              textAlign,
            }}
          >
            {t(locale, "grievance.identity.saveError")}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      {renderHeader()}
      <TextInput
        value={formatCnic(cnic)}
        onChangeText={(value) => setCnic(normalizeCnic(value))}
        keyboardType="number-pad"
        maxLength={15}
        placeholder="35202-1234567-1"
        placeholderTextColor={semanticColors.textSecondary}
        accessibilityLabel={t(locale, "grievance.identity.inputLabel")}
        style={{
          minHeight: 62,
          borderWidth: 1.5,
          borderColor:
            cnic.length > 0 && !validCnic
              ? semanticColors.critical
              : semanticColors.borderEssential,
          borderRadius: radiusUsage.mobileCard,
          backgroundColor: semanticColors.surface,
          color: semanticColors.textPrimary,
          fontFamily: fontFamily.mono,
          fontSize: 20,
          textAlign: "center",
          letterSpacing: 0,
          paddingHorizontal: 16,
        }}
      />
      {cnic.length > 0 && !validCnic ? (
        <Text
          style={{
            color: semanticColors.critical,
            fontSize: mobileType.caption.size,
            lineHeight: mobileType.caption.line,
            fontFamily: copyFamily,
            textAlign,
          }}
        >
          {t(locale, "grievance.identity.invalid")}
        </Text>
      ) : null}
      {error ? (
        <Text
          style={{
            color: semanticColors.critical,
            fontSize: mobileType.caption.size,
            lineHeight: mobileType.caption.line,
            fontFamily: copyFamily,
            textAlign,
          }}
        >
          {t(locale, "grievance.identity.saveError")}
        </Text>
      ) : null}
      <PrimaryCta
        labelKey="grievance.identity.continueCnic"
        icon="card-outline"
        disabled={!validCnic}
        loading={busy}
        onPress={() => setMode("phone")}
      />
      <PrimaryCta
        labelKey="grievance.identity.changeOption"
        icon="arrow-back-outline"
        tone="secondary"
        disabled={busy}
        onPress={() => setMode("choice")}
      />
    </View>
  );
}
