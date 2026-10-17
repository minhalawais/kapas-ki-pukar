import { Ionicons } from "@expo/vector-icons";
import type { AIAnalysis, Evidence, VoiceEvidence } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { workflowPromptId } from "@kapas/speech";
import { Pressable, Text, TextInput, View } from "react-native";

import { PrimaryCta } from "../../../components/primary-cta";
import { ScreenNotice } from "../../../components/screen-notice";
import { useAutoPromptId } from "../../../hooks/use-prompt-playback";
import { useReducedMotion } from "../../../hooks/use-reduced-motion";
import { isRTL } from "../../../i18n/rtl";
import { useLocaleStore } from "../../../stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../../theme/tokens";
import { AIUnderstandingCard } from "../../voice/AIUnderstandingCard";
import { VoiceRecorder } from "../../voice/VoiceRecorder";
import { WaveformPlaceholder } from "../../voice/WaveformPlaceholder";
import { asString } from "../engine";
import type { AnswerValue, QuestionNode } from "../types";

import { AnswerCard, AnswerCardList } from "./AnswerCard";
import { CategoryFieldMap } from "./CategoryFieldMap";
import { EmergencyNotice } from "./EmergencyNotice";
import { EvidenceCard } from "./EvidenceCard";
import { IdentityGate } from "./IdentityGate";
import { LocationCapture, type LocationCaptureStatus } from "./LocationCapture";
import { PrivacyCard } from "./PrivacyCard";

const categoryIcons = {
  WAG: "cash-outline",
  PES: "flask-outline",
  HSE: "medkit-outline",
  HAR: "hand-left-outline",
  CHL: "school-outline",
  FOL: "lock-closed-outline",
  CON: "people-outline",
  HRS: "time-outline",
  SAN: "water-outline",
  DIS: "scale-outline",
  more: "grid-outline",
  OTH: "ellipsis-horizontal",
} as const;

interface Props {
  node: QuestionNode;
  selected?: AnswerValue;
  reviewLines?: { labelKey: MessageKey; value: string; editNodeId?: string }[];
  voice?: VoiceEvidence | null;
  analysis?: AIAnalysis | null;
  evidence?: Evidence[];
  evidenceError?: boolean;
  identityBusy?: boolean;
  identityError?: boolean;
  locationCaptureStatus?: LocationCaptureStatus;
  detectedAddress?: string;
  onSelect: (value: AnswerValue, villageLabel?: string) => void;
  onVoiceChange?: (voice: VoiceEvidence | null) => void;
  onVoiceBusyChange?: (busy: boolean) => void;
  onAddPhoto?: () => void;
  onAddDocument?: () => void;
  onRemoveEvidence?: (id: string) => void;
  onEditSection?: (nodeId: string) => void;
  onSubmitIdentity?: (identity: { kind: "cnic" | "phone"; value: string; reveal: boolean }) => void;
  onRequestCurrentLocation?: () => void;
  onConfirmCurrentLocation?: () => void;
  onManualLocation?: () => void;
}

export function QuestionRenderer({
  node,
  selected,
  reviewLines,
  voice,
  analysis,
  evidence,
  evidenceError,
  identityBusy,
  identityError,
  locationCaptureStatus = "idle",
  detectedAddress,
  onSelect,
  onVoiceChange,
  onVoiceBusyChange,
  onAddPhoto,
  onAddDocument,
  onRemoveEvidence,
  onEditSection,
  onSubmitIdentity,
  onRequestCurrentLocation,
  onConfirmCurrentLocation,
  onManualLocation,
}: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;
  const headingFamily = isRTL(locale) ? fontFamily.urduBold : fontFamily.uiBold;
  const align = isRTL(locale) ? "right" : "left";
  const reduceMotion = useReducedMotion();
  const audio = useAutoPromptId(workflowPromptId(node.id));
  const selectedText = asString(selected);
  const selectedList = Array.isArray(selected) ? selected : [];

  if (node.id === "category" && node.options) {
    return (
      <View style={{ gap: 12 }}>
        {audio.state === "error" ? <ScreenNotice messageKey="audio.error" tone="error" /> : null}
        <CategoryFieldMap
          promptKey={node.promptKey as MessageKey}
          options={node.options}
          selected={selectedText}
          onSelect={(value) => onSelect(value)}
        />
      </View>
    );
  }

  return (
    <View style={{ gap: 18 }}>
      {node.id === "intro" ? (
        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: semanticColors.aiSurface, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="chatbubble-ellipses" size={44} color={semanticColors.voiceActiveStrong} />
          </View>
        </View>
      ) : null}
      {node.type !== "cnic" ? (
        <Text
          style={{
            color: semanticColors.textPrimary,
            fontSize: mobileType.question.size,
            lineHeight: mobileType.question.line,
            fontFamily: headingFamily,
            textAlign: align,
          }}
        >
          {t(locale, node.promptKey as MessageKey)}
        </Text>
      ) : null}
      {node.helperKey && node.id !== "danger-notice" && node.type !== "voice" && node.type !== "cnic" ? (
        <Text
          style={{
            color: semanticColors.textPrimary,
            fontSize: mobileType.body.size,
            lineHeight: mobileType.body.line,
            fontFamily: family,
            textAlign: align,
          }}
        >
          {t(locale, node.helperKey as MessageKey)}
        </Text>
      ) : null}
      {node.id === "danger-notice" ? <EmergencyNotice /> : null}
      {node.type === "cnic" && onSubmitIdentity ? (
        <IdentityGate busy={identityBusy} error={identityError} onSubmitIdentity={onSubmitIdentity} />
      ) : null}
      {node.type === "current-location" && onRequestCurrentLocation && onConfirmCurrentLocation && onManualLocation ? (
        <LocationCapture
          status={locationCaptureStatus}
          address={detectedAddress}
          onRequest={onRequestCurrentLocation}
          onConfirm={onConfirmCurrentLocation}
          onManual={onManualLocation}
        />
      ) : null}
      {audio.state === "error" ? <ScreenNotice messageKey="audio.error" tone="error" /> : null}
      {node.type === "voice" && onVoiceChange ? (
        <VoiceRecorder
          voice={voice ?? null}
          onVoiceChange={onVoiceChange}
          onBusyChange={onVoiceBusyChange}
        />
      ) : null}
      {node.type === "ai-processing" ? (
        <WaveformPlaceholder active reduceMotion={reduceMotion} />
      ) : null}
      {node.type === "ai-understanding" ? <AIUnderstandingCard analysis={analysis} /> : null}
      {node.type === "evidence" ? (
        <View style={{ gap: 12 }}>
          {(evidence ?? []).map((item) => (
            <EvidenceCard
              key={item.id}
              item={item}
              onRemove={() => onRemoveEvidence?.(item.id)}
            />
          ))}
          {evidenceError ? <ScreenNotice messageKey="grievance.evidence.denied" tone="error" /> : null}
          <PrimaryCta
            labelKey="grievance.evidence.addPhoto"
            tone="secondary"
            icon="camera"
            onPress={() => onAddPhoto?.()}
          />
          <PrimaryCta
            labelKey="grievance.evidence.addDocument"
            tone="secondary"
            icon="document-attach"
            onPress={() => onAddDocument?.()}
          />
        </View>
      ) : null}
      {selectedText === "alternate" ? <ScreenNotice messageKey="contact.alternateNote" /> : null}
      {node.id === "privacy" && node.options ? (
        <AnswerCardList>
          {node.options.map((option) => (
            <PrivacyCard
              key={option.value}
              labelKey={option.labelKey as MessageKey}
              helperKey={(option.helperKey ?? option.labelKey) as MessageKey}
              selected={selectedText === option.value}
              onPress={() => onSelect(option.value)}
            />
          ))}
        </AnswerCardList>
      ) : null}
      {node.type === "text" ? (
        <TextInput
          value={selectedText ?? ""}
          onChangeText={onSelect}
          placeholder={t(locale, node.id === "where-city" ? "grievance.where.cityPlaceholder" : "grievance.where.placePlaceholder")}
          placeholderTextColor={semanticColors.textSecondary}
          accessibilityLabel={t(locale, node.promptKey as MessageKey)}
          style={{
            minHeight: 62,
            borderWidth: 1.5,
            borderColor: semanticColors.borderEssential,
            borderRadius: 8,
            backgroundColor: semanticColors.surface,
            color: semanticColors.textPrimary,
            fontFamily: family,
            fontSize: mobileType.body.size,
            lineHeight: mobileType.body.line,
            textAlign: align,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        />
      ) : null}
      {node.options && node.id !== "privacy" ? (
        <AnswerCardList grid={node.id === "category" || node.id === "category-more"}>
          {node.options.map((option) => {
            const isSelected =
              node.type === "multi"
                ? selectedList.includes(option.value)
                : selectedText === option.value;
            return (
              <AnswerCard
                key={option.value}
                labelKey={option.labelKey as MessageKey}
                selected={isSelected}
                tile={node.id === "category" || node.id === "category-more"}
                icon={categoryIcons[option.value as keyof typeof categoryIcons]}
                onPress={() => {
                  if (node.type === "multi") {
                    if (option.value === "none") {
                      onSelect(["none"]);
                      return;
                    }
                    const next = selectedList.filter((item) => item !== "none");
                    onSelect(
                      next.includes(option.value)
                        ? next.filter((item) => item !== option.value)
                        : [...next, option.value],
                    );
                    return;
                  }
                  onSelect(option.value);
                }}
              />
            );
          })}
        </AnswerCardList>
      ) : null}
      {node.type === "review" && reviewLines ? (
        <View style={{ gap: 12 }}>
          {reviewLines.map((line, index) => (
            <View key={line.labelKey} style={{ gap: 4, paddingVertical: 12, borderBottomWidth: index === reviewLines.length - 1 ? 0 : 1, borderBottomColor: semanticColors.border }}>
              <Text
                style={{
                  color: semanticColors.textSecondary,
                  fontSize: mobileType.caption.size,
                  lineHeight: mobileType.caption.line,
                  fontFamily: family,
                  textAlign: align,
                }}
              >
                {t(locale, line.labelKey)}
              </Text>
              <Text
                style={{
                  color: semanticColors.textPrimary,
                  fontSize: mobileType.body.size,
                  lineHeight: mobileType.body.line,
                  fontFamily: family,
                  textAlign: align,
                }}
              >
                {line.value}
              </Text>
              {line.editNodeId && onEditSection ? (
                <Pressable
                  onPress={() => onEditSection(line.editNodeId!)}
                  accessibilityRole="button"
                  accessibilityLabel={t(locale, "grievance.review.change")}
                  style={({ pressed }) => ({ minHeight: 44, flexDirection: isRTL(locale) ? "row-reverse" : "row", alignItems: "center", alignSelf: isRTL(locale) ? "flex-end" : "flex-start", gap: 6, opacity: pressed ? 0.7 : 1 })}
                >
                  <Ionicons name="pencil" size={16} color={semanticColors.actionSecondary} />
                  <Text
                    style={{
                      color: semanticColors.actionSecondary,
                      fontSize: mobileType.caption.size,
                      lineHeight: mobileType.caption.line,
                      fontFamily: family,
                      textAlign: align,
                    }}
                  >
                    {t(locale, "grievance.review.change")}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
