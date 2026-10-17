import type { Complaint } from "@kapas/domain";
import {
  higherPriority,
  type CaseStatus,
  type EmploymentType,
  type Gender,
  type GroupImpact,
  type Priority,
  type PrivacyMode,
  type ReporterType,
  type SubcategoryCode,
  type WorkerCategoryCode,
  subcategoriesByCategory,
} from "@kapas/domain";

import { buildComplaint } from "./factory";
import { DEMO_LOCATIONS } from "./locations";
import { bagFromCounts, createRng, shuffle } from "./rng";
import { goldenComplaints } from "./scenarios";

export const SEED_RANDOM = 20260819;
export const SEED_SIZE = 200;

const CATEGORY_COUNTS: ReadonlyArray<readonly [WorkerCategoryCode, number]> = [
  ["WAG", 60],
  ["CON", 30],
  ["HSE", 24],
  ["PES", 24],
  ["HRS", 16],
  ["SAN", 12],
  ["HAR", 12],
  ["DIS", 8],
  ["CHL", 6],
  ["FOL", 4],
  ["OTH", 4],
];

const STATUS_COUNTS: ReadonlyArray<readonly [CaseStatus, number]> = [
  ["Submitted", 36],
  ["Under Review", 50],
  ["Action in Progress", 50],
  ["Proposed Resolution", 14],
  ["Resolved", 28],
  ["Reopened", 4],
  ["Closed", 18],
];

const PRIORITY_COUNTS: ReadonlyArray<readonly [Priority, number]> = [
  ["Emergency", 6],
  ["Critical", 20],
  ["High", 64],
  ["Standard", 110],
];

const PRIVACY_COUNTS: ReadonlyArray<readonly [PrivacyMode, number]> = [
  ["ANON", 70],
  ["CONF", 90],
  ["IDEN", 40],
];

const GENDER_COUNTS: ReadonlyArray<readonly [Gender, number]> = [
  ["Female", 110],
  ["Male", 80],
  ["Not Stated", 8],
  ["Other", 2],
];

const WORKER_NAMES = [
  "Amina Bibi",
  "Razia",
  "Shazia",
  "Naseem",
  "Parveen",
  "Sughra",
  "Bilal",
  "Aslam",
  "Nadeem",
  "Yousaf",
  "Farzana",
  "Khalida",
] as const;

function affectedText(range: GroupImpact): { en: string; ur: string } {
  if (range === "2-5") return { en: "three or four workers are affected", ur: "تین چار مزدور متاثر ہیں" };
  if (range === "6-20") return { en: "several workers in our group are affected", ur: "ہمارے گروپ کے کئی مزدور متاثر ہیں" };
  if (range === "more-than-20") return { en: "more than twenty workers are affected", ur: "بیس سے زیادہ مزدور متاثر ہیں" };
  if (range === "not-sure") return { en: "I am not sure how many others are affected", ur: "مجھے پتا نہیں اور کتنے لوگ متاثر ہیں" };
  return { en: "I am reporting my own issue", ur: "میں اپنا مسئلہ بتا رہا/رہی ہوں" };
}

function fieldPlace(location: Complaint["location"]): string {
  return [location.villageLabel, location.tehsil, location.district].filter(Boolean).join(", ");
}

function realisticStatement(seed: {
  categoryCode: WorkerCategoryCode;
  subcategoryCode?: SubcategoryCode;
  affectedRange: GroupImpact;
  location: Complaint["location"];
  currentDanger: boolean;
  rng: ReturnType<typeof createRng>;
}): { en: string; ur: string } {
  const affected = affectedText(seed.affectedRange);
  const place = fieldPlace(seed.location);
  const dailyRate = seed.rng.pick([900, 1000, 1100, 1200, 1300]);
  const paidRate = Math.max(500, dailyRate - seed.rng.pick([200, 300, 400]));
  const perKgRate = seed.rng.pick([35, 40, 45, 50]);
  const hours = seed.rng.pick([10, 11, 12, 13]);
  const days = seed.rng.pick([5, 7, 10, 14]);

  if (seed.categoryCode === "WAG") {
    const options = [
      {
        en: `At ${place}, the agreed wage was PKR ${dailyRate} per day but only PKR ${paidRate} was paid after cotton picking. ${affected.en}.`,
        ur: `${place} میں کپاس چننے کی روزانہ اجرت ${dailyRate} روپے طے ہوئی تھی مگر کام کے بعد صرف ${paidRate} روپے دیے گئے۔ ${affected.ur}۔`,
      },
      {
        en: `The contractor said payment would be made every week, but wages have been delayed for ${days} days. ${affected.en}.`,
        ur: `ٹھیکیدار نے کہا تھا کہ ہر ہفتے اجرت ملے گی، لیکن ${days} دن سے پیسے رکے ہوئے ہیں۔ ${affected.ur}۔`,
      },
      {
        en: `We picked cotton on piece rate at PKR ${perKgRate} per kilo, but the weight was written lower than what we brought to the scale.`,
        ur: `ہم نے ${perKgRate} روپے فی کلو کے حساب سے کپاس چنی، مگر کانٹے پر ہمارا وزن کم لکھا گیا۔`,
      },
    ];
    return seed.rng.pick(options);
  }

  if (seed.categoryCode === "PES") {
    const emergency = seed.currentDanger
      ? {
          en: "I still have dizziness and breathing trouble, so please treat this as urgent.",
          ur: "ابھی بھی چکر اور سانس کا مسئلہ ہے، اس لیے اسے فوری سمجھیں۔",
        }
      : {
          en: "The symptoms are less now, but we need safe instructions before going back into the field.",
          ur: "علامات کچھ کم ہیں مگر دوبارہ کھیت میں جانے سے پہلے محفوظ ہدایات چاہئیں۔",
        };
    return {
      en: `Spray was done near the cotton rows at ${place}. We were asked to enter soon after without masks or gloves. ${emergency.en}`,
      ur: `${place} میں کپاس کی قطاروں کے قریب سپرے ہوا۔ ہمیں ماسک اور دستانوں کے بغیر جلدی اندر بھیج دیا گیا۔ ${emergency.ur}`,
    };
  }

  if (seed.categoryCode === "HSE") {
    return seed.rng.pick([
      {
        en: `A worker was hurt while loading cotton sacks because no gloves or first-aid box were available at ${place}. We had to arrange treatment ourselves.`,
        ur: `${place} میں کپاس کی بوریاں اٹھاتے ہوئے مزدور کو چوٹ لگی کیونکہ دستانے اور فرسٹ ایڈ باکس موجود نہیں تھے۔ علاج ہمیں خود کروانا پڑا۔`,
      },
      {
        en: `The heat was severe and there was no shaded rest place. We worked for ${hours} hours and two pickers felt faint.`,
        ur: `گرمی بہت زیادہ تھی اور آرام کے لیے سایہ نہیں تھا۔ ہم نے ${hours} گھنٹے کام کیا اور دو چننے والوں کو چکر آئے۔`,
      },
    ]);
  }

  if (seed.categoryCode === "HAR") {
    return {
      en: `The supervisor uses abusive language and threatens to stop work if we complain. I want my identity protected before anyone contacts the field owner.`,
      ur: `نگران بدزبانی کرتا ہے اور شکایت کرنے پر کام بند کرنے کی دھمکی دیتا ہے۔ کھیت کے مالک سے رابطہ کرنے سے پہلے میری شناخت محفوظ رکھی جائے۔`,
    };
  }

  if (seed.categoryCode === "CHL") {
    return {
      en: `A child who looks under age is picking cotton for long hours and was also sent near sprayed plants. I am reporting so the child can be protected safely.`,
      ur: `ایک کم عمر بچہ لمبے وقت تک کپاس چن رہا ہے اور اسے سپرے والی فصل کے قریب بھی بھیجا گیا۔ میں یہ بات بچے کی حفاظت کے لیے بتا رہا/رہی ہوں۔`,
    };
  }

  if (seed.categoryCode === "FOL") {
    return {
      en: `The labour contractor says our advance must be cleared before we can leave. Wages are being kept back and we are being pressured to stay at the camp.`,
      ur: `مزدور ٹھیکیدار کہتا ہے کہ ادھار ختم کیے بغیر ہم جا نہیں سکتے۔ اجرت روکی جا رہی ہے اور کیمپ میں رہنے کا دباؤ ہے۔`,
    };
  }

  if (seed.categoryCode === "CON") {
    return {
      en: `The contractor brought us for cotton work and promised transport and payment, but now deductions are being made for transport and meals without telling us clearly.`,
      ur: `ٹھیکیدار ہمیں کپاس کے کام کے لیے لایا اور سواری و ادائیگی کا وعدہ کیا، مگر اب کرایہ اور کھانے کی کٹوتی بغیر صاف بتائے کی جا رہی ہے۔`,
    };
  }

  if (seed.categoryCode === "HRS") {
    return {
      en: `We start before sunrise and continue until evening during picking days. Rest breaks are short and extra hours are not counted separately.`,
      ur: `چنائی کے دنوں میں ہم سورج نکلنے سے پہلے کام شروع کرتے ہیں اور شام تک کرتے ہیں۔ آرام کا وقفہ کم ہے اور اضافی گھنٹوں کا الگ حساب نہیں ہوتا۔`,
    };
  }

  if (seed.categoryCode === "SAN") {
    return {
      en: `There is no clean drinking water or separate toilet near the picking area at ${place}. Women workers have to walk far away from the field.`,
      ur: `${place} میں چنائی والی جگہ کے قریب صاف پینے کا پانی یا الگ بیت الخلا نہیں۔ خواتین مزدوروں کو کھیت سے دور جانا پڑتا ہے۔`,
    };
  }

  if (seed.categoryCode === "DIS") {
    return {
      en: `Some workers are given lighter rows and full payment, while migrant pickers in our group are given harder rows and lower rates for the same cotton work.`,
      ur: `کچھ مزدوروں کو آسان قطاریں اور پوری اجرت ملتی ہے، مگر ہمارے گروپ کے باہر سے آئے مزدوروں کو اسی کام پر مشکل قطاریں اور کم ریٹ دیا جاتا ہے۔`,
    };
  }

  return {
    en: `I am reporting a cotton-field work issue at ${place}. The problem is affecting work and payment, and I need someone to review it safely.`,
    ur: `میں ${place} میں کپاس کے کام کا مسئلہ بتا رہا/رہی ہوں۔ اس سے کام اور ادائیگی متاثر ہو رہی ہے، براہ کرم محفوظ طریقے سے جائزہ لیں۔`,
  };
}

function floorPriority(category: WorkerCategoryCode, danger: boolean, base: Priority): Priority {
  let floor: Priority = "Standard";
  if (danger) {
    floor = "Emergency";
  } else if (category === "CHL" || category === "FOL") {
    floor = "Critical";
  }
  return higherPriority(base, floor);
}

export function generateComplaints(seed = SEED_RANDOM): Complaint[] {
  const rng = createRng(seed);
  const categories = shuffle(bagFromCounts(CATEGORY_COUNTS), rng);
  const statuses = shuffle(bagFromCounts(STATUS_COUNTS), rng);
  const priorities = shuffle(bagFromCounts(PRIORITY_COUNTS), rng);
  const privacies = shuffle(bagFromCounts(PRIVACY_COUNTS), rng);
  const genders = shuffle(bagFromCounts(GENDER_COUNTS), rng);

  const records: Complaint[] = [];
  for (let i = 0; i < SEED_SIZE; i += 1) {
    const index = i + 1;
    const categoryCode = categories[i] as WorkerCategoryCode;
    const subs = subcategoriesByCategory[categoryCode];
    const subcategoryCode = subs.length > 0 ? rng.pick(subs) : undefined;
    const currentDanger = categoryCode === "PES" ? rng.next() < 0.25 : rng.next() < 0.04;
    const priority = floorPriority(categoryCode, currentDanger, priorities[i] as Priority);
    const created = new Date("2026-05-21T08:00:00.000Z");
    created.setUTCDate(created.getUTCDate() + rng.int(90));
    created.setUTCHours(6 + rng.int(10));
    const affectedRange = ((): GroupImpact => {
      const roll = rng.next();
      if (roll < 0.55) {
        return "individual";
      }
      if (roll < 0.75) {
        return "2-5";
      }
      if (roll < 0.9) {
        return "6-20";
      }
      if (roll < 0.97) {
        return "more-than-20";
      }
      return "not-sure";
    })();
    const loc = rng.pick(DEMO_LOCATIONS);
    const statement = realisticStatement({
      categoryCode,
      subcategoryCode: subcategoryCode as SubcategoryCode | undefined,
      affectedRange,
      location: { ...loc, exactCoordinates: null },
      currentDanger,
      rng,
    });
    records.push(
      buildComplaint({
        index,
        categoryCode,
        subcategoryCode: subcategoryCode as SubcategoryCode | undefined,
        status: statuses[i] as CaseStatus,
        priority,
        privacyMode: privacies[i] as PrivacyMode,
        reporterType: rng.pick(["self", "coworker", "family", "community", "other"] as const) as ReporterType,
        gender: genders[i] as Gender,
        affectedWorkerType: rng.pick([
          "seasonal-picker",
          "daily-wage",
          "piece-rate",
          "migrant",
          "contractor",
        ] as const) as EmploymentType,
        affectedRange,
        location: { ...loc, exactCoordinates: null },
        createdAt: created.toISOString(),
        currentDanger,
        description: statement.en,
        descriptionUr: statement.ur,
        whenLabel: rng.pick(["Today", "This week", "This month", "Not sure"]),
        confidenceScore: 0.62 + rng.next() * 0.35,
        hasVoice: rng.next() > 0.08,
        hasEvidence: rng.next() > 0.35,
        displayName: rng.pick(WORKER_NAMES),
      }),
    );
  }

  const byId = new Map(records.map((row) => [row.trackingId, row]));
  for (const golden of goldenComplaints()) {
    byId.set(golden.trackingId, golden);
  }
  return [...byId.values()].sort((a, b) => a.trackingId.localeCompare(b.trackingId));
}
