"use client";

import { getWorkflowNode, type Complaint } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { CalendarDays, Contact, Fingerprint, MapPin, ShieldCheck, UserRound, Users } from "lucide-react";
import type { ReactNode } from "react";

import { ComplaintLocationMap } from "@/components/case/ComplaintLocationMap";
import { Card } from "@/components/ui/card";
import { PrivacyBadge } from "@/components/ui/semantic-badge";
import { fullLocationLabel, structuredAnswerRows, whenLabelMessageKey } from "@/lib/case-workspace";
import { useLocaleStore } from "@/stores/locale-store";

function Fact({
  icon: Icon,
  label,
  value,
  ltr = false,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  value?: string;
  ltr?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 py-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-page text-[var(--brand-fos-teal-dark)]">
        <Icon aria-hidden size={16} />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-medium text-muted">{label}</dt>
        {children ?? (
          <dd
            className="mt-0.5 break-words text-sm font-medium text-ink"
            dir={ltr ? "ltr" : undefined}
          >
            {value}
          </dd>
        )}
      </div>
    </div>
  );
}

function contactPreferenceLabel(
  locale: "en" | "ur",
  preference: string | undefined,
): string {
  const node = getWorkflowNode("contact");
  const option = node?.options?.find((item) => item.value === preference);
  if (option) return t(locale, option.labelKey as MessageKey);
  if (preference === "do-not-initiate") return t(locale, "contact.doNotInitiate");
  return t(locale, "portal.case.notAvailable");
}

export function WorkerReportPanel({ complaint }: { complaint: Complaint }) {
  const locale = useLocaleStore((s) => s.locale);
  const rows = structuredAnswerRows(complaint);
  const affected = complaint.affectedRange ?? complaint.incident.othersAffected;
  const contactPreference =
    complaint.reporter.contactPreference ??
    (typeof complaint.incident.structuredAnswers.contactPreference === "string"
      ? complaint.incident.structuredAnswers.contactPreference
      : undefined);
  const whenKey = whenLabelMessageKey(complaint.incident.whenLabel);
  const whenDisplay = whenKey
    ? t(locale, whenKey)
    : complaint.incident.whenLabel || t(locale, "portal.case.notAvailable");
  const phoneDisplay = complaint.phoneLast4
    ? `03••••••${complaint.phoneLast4}`
    : t(locale, "portal.case.notAvailable");
  const cnicDisplay = complaint.cnicLast4
    ? `••••-•••••••-${complaint.cnicLast4}`
    : t(locale, "portal.case.notAvailable");
  const showContactDetails =
    complaint.privacyMode !== "ANON" &&
    contactPreference &&
    contactPreference !== "do-not-initiate";
  const narrative = complaint.incident.description?.trim();
  const deviceCoordinates = complaint.location.exactCoordinates;

  return (
    <Card className="p-0">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink">
              {t(locale, "portal.case.workerReport")}
            </h2>
            <p className="mt-0.5 text-xs text-muted">{t(locale, "portal.case.workerReportNote")}</p>
          </div>
          <span className="rounded-control bg-[var(--surface-soft-teal)] px-2 py-1 text-[11px] font-semibold text-[var(--brand-fos-teal-dark)]">
            {t(locale, "portal.case.source.worker")}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-border px-4 sm:grid-cols-2 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
        <dl className="divide-y divide-border sm:pe-4">
          <Fact
            icon={MapPin}
            label={t(locale, "portal.table.location")}
            value={fullLocationLabel(complaint) || t(locale, "portal.case.notAvailable")}
          />
          <Fact
            icon={CalendarDays}
            label={t(locale, "portal.case.incidentWhen")}
            value={whenDisplay}
          />
          <Fact
            icon={Users}
            label={t(locale, "portal.case.facts.affected")}
            value={t(
              locale,
              affected === "individual"
                ? "others.no"
                : (`range.${affected === "more-than-20" ? "20+" : affected === "not-sure" ? "unsure" : affected}` as MessageKey),
            )}
          />
        </dl>
        <dl className="divide-y divide-border sm:ps-4">
          <Fact icon={ShieldCheck} label={t(locale, "portal.table.privacy")}>
            <dd className="mt-1">
              <PrivacyBadge privacy={complaint.privacyMode} />
            </dd>
          </Fact>
          <Fact
            icon={Contact}
            label={t(locale, "portal.case.contactPreference")}
            value={contactPreferenceLabel(locale, contactPreference)}
          />
          {complaint.privacyMode !== "ANON" ? (
            <>
              {complaint.privacyMode === "IDEN" && complaint.reporter.displayName ? (
                <Fact
                  icon={UserRound}
                  label={t(locale, "portal.case.reporter")}
                  value={complaint.reporter.displayName}
                />
              ) : null}
              <Fact
                icon={Contact}
                label={t(locale, "portal.case.mobileNumber")}
                value={phoneDisplay}
                ltr
              />
              <Fact
                icon={Fingerprint}
                label={t(locale, "portal.case.cnicLast4")}
                value={cnicDisplay}
                ltr
              />
            </>
          ) : null}
        </dl>
      </div>
      {deviceCoordinates ? (
        <div className="border-t border-border px-4 py-4">
          <h3 className="text-sm font-semibold text-ink">
            {t(locale, "portal.case.deviceLocationMap")}
          </h3>
          <ComplaintLocationMap
            coordinates={deviceCoordinates}
            accuracyMeters={complaint.location.accuracyMeters}
          />
        </div>
      ) : null}
      {showContactDetails ? (
        <dl className="grid grid-cols-1 gap-0 border-t border-border bg-page px-4 py-2 sm:grid-cols-2 sm:divide-x sm:divide-border rtl:sm:divide-x-reverse">
          {complaint.reporter.representativeContact ? (
            <div className="py-2 sm:px-3">
              <dt className="text-[11px] text-muted">
                {t(locale, "portal.case.representativeContact")}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-ink">
                {complaint.reporter.representativeContact}
              </dd>
            </div>
          ) : null}
          {complaint.reporter.preferredLanguage ? (
            <div className="py-2 sm:px-3">
              <dt className="text-[11px] text-muted">
                {t(locale, "portal.case.preferredLanguage")}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-ink">
                {t(
                  locale,
                  complaint.reporter.preferredLanguage === "ur" ? "language.urdu" : "language.english",
                )}
              </dd>
            </div>
          ) : null}
          {complaint.reporter.safeContactWindow ? (
            <div className="py-2 sm:px-3">
              <dt className="text-[11px] text-muted">
                {t(locale, "portal.case.safeContactWindow")}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-ink">
                {complaint.reporter.safeContactWindow}
              </dd>
            </div>
          ) : null}
          <div className="py-2 sm:px-3">
            <dt className="text-[11px] text-muted">{t(locale, "portal.case.safeVoicemail")}</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">
              {t(locale, complaint.reporter.safeVoicemail ? "common.yes" : "common.no")}
            </dd>
          </div>
        </dl>
      ) : null}
      {complaint.reporterType !== "self" ? (
        <dl className="border-t border-border px-4 py-2">
          <dt className="text-[11px] text-muted">{t(locale, "portal.case.reporterType")}</dt>
          <dd className="mt-0.5 text-sm font-medium text-ink">
            {t(locale, `portal.reporter.${complaint.reporterType}` as MessageKey)}
          </dd>
        </dl>
      ) : null}
      {narrative ? (
        <div className="border-t border-border px-4 py-4">
          <h3 className="text-sm font-semibold text-ink">{t(locale, "portal.case.workerNarrative")}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink">{narrative}</p>
        </div>
      ) : null}
      {rows.length > 0 ? (
        <div className="border-t border-border px-4 py-4">
          <h3 className="text-sm font-semibold text-ink">
            {t(locale, "portal.case.structuredDetails")}
          </h3>
          <dl className="mt-2 divide-y divide-border">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid gap-1 py-2.5 sm:grid-cols-[minmax(180px,0.8fr)_minmax(0,1.2fr)] sm:gap-4"
              >
                <dt className="text-xs text-muted">{t(locale, row.promptKey)}</dt>
                <dd className="text-sm font-medium text-ink">
                  {[...row.answerKeys.map((key) => t(locale, key)), ...row.rawValues].join("، ")}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </Card>
  );
}
