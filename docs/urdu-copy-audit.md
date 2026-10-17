# Urdu Copy Audit: Mobile App and Web Portal

Date: 2026-08-23

## Scope

Reviewed the shared Urdu catalog used by both the mobile app and web portal:

- `packages/localization/src/locales/ur.json`
- `apps/mobile/src/i18n/locales/ur.json`

These two files currently contain the same 972 keys and identical values. The portal mostly uses `@kapas/localization`, so fixes should be made in the shared package first and then synced to the mobile mirror.

Also reviewed Urdu strings outside the catalog in:

- `packages/ai/src/scenarioOutputs.ts`
- `packages/mock-data/src/scenarios/*.ts`
- app and portal source files with hardcoded Urdu separators or generated answer joins

## Overall Finding

The Urdu is understandable in many places, but the register is inconsistent. Some strings are literal English translations, some are administrative/legal Urdu, and some are unnatural for low-literacy rural cotton workers. The largest problems are:

- Status words translated too literally, especially `جاری`, `خبر`, `آپ کی ضرورت`.
- Portal copy mixing English product words with Urdu: `AI Summary`, `Suggested Priority`, `گریونس`, `سیناریو`, `ٹرانسکرپٹ`.
- Rights copy sometimes reads like a legal memo, not a worker-facing guidance screen.
- Several labels are ambiguous because they use `اور` where the intended meaning is `کوئی اور`.
- Some demo labels are grammatically incomplete noun fragments.

## High-Priority Fixes

These are visible to end users and create wrong or awkward meaning.

| Key | Current Urdu | Issue | Recommended Urdu |
|---|---|---|---|
| `complaints.activeCount` | جاری | `جاری` alone is weak/unfinished as a case status count. | زیرِ کارروائی |
| `complaints.filter.active` | جاری | Same issue in filter tab. | زیرِ کارروائی |
| `portal.kpi.inProgress` | جاری | Same issue on web dashboard KPI. | زیرِ کارروائی |
| `portal.status.Action in Progress` | کارروائی جاری | Acceptable but blunt; better case-status Urdu. | زیرِ کارروائی |
| `complaints.needsAttention` | آپ کی ضرورت | Means "your need", not "needs your attention". | آپ کا جواب درکار |
| `complaints.filter.attention` | آپ کی ضرورت | Same issue in filter. | جواب درکار |
| `complaints.overdue` | خبر میں تاخیر | `خبر` is not the right noun for case update/status. | اپ ڈیٹ میں تاخیر |
| `complaints.next.overdue` | متوقع خبر میں تاخیر ہے۔ آپ کی شکایت کھلی ہے اور گم نہیں ہوئی۔ | "expected news" sounds unnatural. | متوقع اپ ڈیٹ میں تاخیر ہے۔ آپ کی شکایت ابھی کھلی ہے اور ریکارڈ میں محفوظ ہے۔ |
| `complaints.expectedBy` | اگلی خبر متوقع | Awkward status label. | اگلی اپ ڈیٹ متوقع |
| `home.trackHint` | پیش رفت اور نئی خبر دیکھیں | "new news" is literal and awkward. | پیش رفت اور تازہ اپ ڈیٹ دیکھیں |
| `complaints.next.action` | کارروائی جاری ہے۔ اگلی خبر یہاں دیکھیں۔ | "اگلی خبر" is not correct product Urdu. | کارروائی جاری ہے۔ اگلی اپ ڈیٹ یہاں دیکھیں۔ |
| `grievance.category.morePrompt` | اور قسم کا مسئلہ | Incorrect grammar. | کوئی اور مسئلہ |
| `category.OTH` | اور | Ambiguous and grammatically incomplete. | کوئی اور |
| `grievance.review.others` | اور متاثر | Incomplete phrase. | دوسرے متاثرہ مزدور |
| `hrs.what.overtime` | زبردستی اضافہ وقت | Incorrect construction. | زبردستی اضافی وقت |
| `hrs.often.prompt` | کتنا بار؟ | Incorrect grammar. | کتنی بار؟ |
| `har.private.prompt` | کیا آپ خلوت میں آگے بڑھنا چاہتے ہیں؟ | `خلوت` is overly formal and can imply seclusion; unsafe tone for harassment. | کیا آپ اکیلے میں آگے بڑھنا چاہتی/چاہتے ہیں؟ |
| `har.female.prompt` | خاتون پی یو ڈبلیو ایف نمائندہ پسند ہے؟ | Sounds like preference for a person, not safety option. | کیا آپ خاتون نمائندہ سے بات کرنا چاہیں گی؟ |
| `privacy.ANON.help` | جو بات آپ نہیں بتائیں گے اس سے پی یو ڈبلیو ایف آپ کو نہیں پہچانے گی۔ | Awkward causal grammar. | اگر آپ نام یا شناخت نہیں دیں گے تو پی یو ڈبلیو ایف آپ کو شناخت نہیں کرے گی۔ |
| `privacy.CONF.help` | پی یو ڈبلیو ایف آپ کو جان سکتی ہے۔ یہ باہر بانٹنے کے لیے نہیں۔ | "جان سکتی ہے" sounds odd. | پی یو ڈبلیو ایف آپ کی شناخت جان سکے گی، مگر اسے باہر شیئر نہیں کیا جائے گا۔ |
| `privacy.IDEN.help` | اس کیس کے دوران آپ کا نام استعمال ہو سکتا ہے۔ | Usable, but needs worker-safe clarity. | اس شکایت پر کارروائی کے دوران آپ کا نام استعمال ہو سکتا ہے۔ |
| `permission.allow` | آگے بڑھیں | Vague for microphone permission. | مائیکروفون کی اجازت دیں |
| `grievance.ai.summaryLabel` | AI Summary | English in Urdu UI. | ہم نے یہ سمجھا |
| `grievance.ai.suggestedCategory` | Suggested category | English in Urdu UI. | ممکنہ مسئلہ |
| `grievance.ai.unavailable` | AI خلاصہ دستیاب نہیں۔ آپ کی ریکارڈنگ محفوظ ہے۔ | Technical and mixed-language. | خودکار خلاصہ دستیاب نہیں۔ آپ کی ریکارڈنگ محفوظ ہے۔ |

## Complaint and Tracking Module

These strings affect "Meri Shakayat", complaint details, and status cards.

| Key | Current Urdu | Issue | Recommended Urdu |
|---|---|---|---|
| `complaints.overview` | آپ کی شکایت کا ریکارڈ | Fine, but plural screen shows all complaints. | آپ کی شکایات کا ریکارڈ |
| `complaints.overviewHelp` | اس فون پر تمام نئی معلومات ایک جگہ محفوظ ہیں۔ | "all new information" is vague. | اس فون پر آپ کی شکایات کی تازہ معلومات محفوظ ہیں۔ |
| `complaints.completed` | مکمل | OK, but for count better. | مکمل شدہ |
| `complaints.filter.complete` | مکمل | OK but tab can be clearer. | مکمل شدہ |
| `complaints.filteredEmpty` | اس حصے میں کوئی شکایت نہیں ہے۔ | Fine but formal. | اس حصے میں ابھی کوئی شکایت نہیں۔ |
| `complaints.progress.received` | موصول | Fine, but worker-facing can be simpler. | مل گئی |
| `complaints.progress.review` | جائزہ | OK. | جائزہ |
| `complaints.progress.action` | کارروائی | OK. | کارروائی |
| `complaints.progress.outcome` | نتیجہ | OK. | نتیجہ |
| `complaints.next.review` | ٹیم آپ کی شکایت دیکھ رہی ہے۔ ابھی آپ کو کچھ کرنے کی ضرورت نہیں۔ | Natural enough, but "team" abstract. | پی یو ڈبلیو ایف آپ کی شکایت دیکھ رہی ہے۔ ابھی آپ کو کچھ کرنے کی ضرورت نہیں۔ |
| `complaints.next.awaiting` | کارروائی جاری رکھنے کے لیے ٹیم کو آپ سے مزید معلومات درکار ہیں۔ | "team" abstract. | کارروائی آگے بڑھانے کے لیے پی یو ڈبلیو ایف کو آپ سے مزید معلومات چاہیے۔ |
| `complaints.next.escalated` | آپ کی شکایت سینئر یا متعلقہ ماہر ٹیم کو بھیج دی گئی ہے۔ | "senior team" portal-ish. | آپ کی شکایت مزید جائزے کے لیے متعلقہ ماہر فرد کو بھیجی گئی ہے۔ |
| `complaints.next.proposed` | تجویز کردہ نتیجہ دیکھیں اور بتائیں کہ مسئلہ حل ہوا یا نہیں۔ | Good but formal. | تجویز کردہ حل دیکھیں اور بتائیں کہ مسئلہ حل ہوا یا نہیں۔ |
| `complaints.next.closed` | یہ شکایت بند ہوچکی ہے۔ اس کا ریکارڈ یہاں محفوظ ہے۔ | OK. | یہ شکایت بند ہو چکی ہے۔ اس کا ریکارڈ یہاں محفوظ ہے۔ |
| `complaints.next.reopened` | آپ کی شکایت دوبارہ دیکھی جا رہی ہے۔ | OK. | آپ کی شکایت دوبارہ دیکھی جا رہی ہے۔ |
| `complaints.reportedOn` | درج کرنے کی تاریخ | OK but heavy. | رپورٹ کی تاریخ |
| `complaints.location` | شکایت کی جگہ | OK. | واقعے کی جگہ |
| `complaints.affected` | متاثرہ لوگ | Generic. | متاثرہ مزدور |
| `complaints.whatYouToldUs` | آپ نے ہمیں کیا بتایا | Good, but "ہمیں" can be ambiguous. | آپ نے پی یو ڈبلیو ایف کو کیا بتایا |
| `complaints.resolution` | درج شدہ نتیجہ | Formal. | درج شدہ حل |
| `status.worker.needInfo` | پی یو ڈبلیو ایف کو مزید معلومات چاہیے | Good. | پی یو ڈبلیو ایف کو مزید معلومات چاہیے |
| `status.worker.action` | کارروائی ہو رہی ہے | Fine but can match status. | کارروائی جاری ہے |
| `status.worker.proposed` | ایک تجویز تیار ہے | Too vague. | حل کی تجویز تیار ہے |
| `status.action.update` | اپ ڈیٹ | Mixed but acceptable product Urdu; keep consistent. | اپ ڈیٹ |

## Complaint Registration Module

| Key | Current Urdu | Issue | Recommended Urdu |
|---|---|---|---|
| `grievance.placeholder` | شکایت کی گفتگو اگلے مرحلے میں شروع ہوگی۔ | Developer/demo language, not user-facing. | اگلے قدم میں آسان سوال شروع ہوں گے۔ |
| `grievance.identity.prompt` | سب سے پہلے، آپ اپنی شناخت کیسے دینا چاہتے ہیں؟ | OK but direct. | سب سے پہلے، شناخت کے بارے میں بتائیں۔ |
| `grievance.identity.body` | اپنا شناختی کارڈ نمبر لکھیں، یا اگر بتانا محفوظ نہ لگے تو گمنام رپورٹ کریں۔ | Good. | اپنا شناختی کارڈ نمبر لکھیں، یا اگر محفوظ نہ لگے تو گمنام رپورٹ کریں۔ |
| `grievance.identity.secureNote` | آپ کا پورا شناختی کارڈ نمبر فون کے محفوظ حصے میں رکھا جاتا ہے اور شکایت کے مسودے میں نہیں دکھایا جاتا۔ | Too technical. | پورا شناختی کارڈ نمبر فون کے محفوظ حصے میں رہے گا اور مسودے میں نہیں دکھے گا۔ |
| `grievance.category.visualHint` | مسئلے سے ملتی ہوئی تصویر چنیں۔ | Good. | اپنے مسئلے سے ملتی تصویر چنیں۔ |
| `grievance.voice.prompt` | اپنے الفاظ میں بتائیں کیا ہوا۔ | Slightly unnatural order. | اپنے الفاظ میں بتائیں کہ کیا ہوا۔ |
| `grievance.where.useCurrent` | میرا موجودہ مقام لیں | Natural enough, but permission action can be clearer. | موجودہ مقام استعمال کریں |
| `grievance.where.locating` | آپ کا مقام تلاش ہو رہا ہے... | Use Urdu ellipsis/punctuation consistency. | آپ کا مقام تلاش ہو رہا ہے۔۔۔ |
| `grievance.others.prompt` | کیا اور مزدور بھی متاثر ہیں؟ | Good spoken Urdu. | کیا دوسرے مزدور بھی متاثر ہیں؟ |
| `grievance.danger.noticeBody` | پی یو ڈبلیو ایف اسے ایمرجنسی کیس دیکھے گی۔ اس ڈیمو میں لائیو الرٹ نہیں جاتا۔ | Grammar issue: "case دیکھے گی"; "live alert" mixed. | پی یو ڈبلیو ایف اسے فوری نوعیت کی شکایت سمجھے گی۔ اس ڈیمو میں اصل الرٹ نہیں جاتا۔ |
| `grievance.privacy.prompt` | آپ کا نام کیسے رکھا جائے؟ | Wrong meaning: sounds like naming someone. | آپ کی شناخت کیسے رکھی جائے؟ |
| `grievance.evidence.prompt` | تصویر یا دستاویز؟ | Too abrupt but acceptable. | کیا تصویر یا دستاویز شامل کرنی ہے؟ |
| `grievance.contact.prompt` | کیا آپ سے رابطہ محفوظ ہے؟ | Good. | کیا آپ سے رابطہ کرنا محفوظ ہے؟ |
| `grievance.review.missing` | پہلے مسئلہ کی قسم اور نام کا طریقہ چنیں۔ | "name method" wrong. | پہلے مسئلے کی قسم اور شناخت کا طریقہ چنیں۔ |
| `grievance.success.pin` | اس گمنام ڈیمو کا مقامی پن | Too technical. | اس گمنام رپورٹ کا مقامی پن |
| `contact.alternate` | ڈیمو دوسرا نمبر | Grammatically incomplete. | دوسرا نمبر |
| `contact.alternateNote` | ڈیمو رابطہ محفوظ ہوتا ہے۔ لائیو کال نہیں ہوتی۔ | Demo-ish, unnatural. | یہ صرف ڈیمو رابطہ ہے۔ اصل کال نہیں ہوگی۔ |
| `voice.recordingFailed` | ریکارڈنگ نہیں رکی۔ دوبارہ کوشش کر سکتے ہیں۔ | If recording failed, not necessarily "did not stop". | ریکارڈنگ محفوظ نہیں ہو سکی۔ دوبارہ کوشش کریں۔ |

## Rights Module

Worker-facing rights content needs simpler, warmer Urdu. Not every long legal sentence is wrong, but these should be revised before final release.

| Key | Current Urdu | Issue | Recommended Urdu |
|---|---|---|---|
| `rights.choosePrompt` | آپ کن حقوق کے بارے میں جاننا چاہتے ہیں؟ | Grammatically fine. Better singular spoken flow. | آپ کس حق کے بارے میں جاننا چاہتے ہیں؟ |
| `rights.intro` | مختصر رہنمائی سنیں، خطرے کی نشانیاں پہچانیں اور محفوظ اگلا قدم چنیں۔ | Good but a little formal. | مختصر رہنمائی سنیں، خطرے کی نشانیاں پہچانیں، پھر محفوظ قدم چنیں۔ |
| `rights.area.help` | متعلقہ قانونی بات دیکھنے کے لیے پنجاب یا سندھ چنیں۔ | Now location coverage expanded; this is outdated. | اپنے صوبے کے مطابق رہنمائی دیکھنے کے لیے علاقہ چنیں۔ |
| `rights.section.guidance` | یہ حق کس چیز کی حفاظت کرتا ہے | Heavy phrase. | یہ حق کس چیز سے بچاتا ہے |
| `rights.legalNote` | تحفظ صوبے اور کام کے بندوبست کے مطابق بدل سکتا ہے۔ ضرورت پر اپنے معاملے کے لیے مدد لیں۔ | "ضرورت پر" is unnatural. | تحفظ صوبے اور کام کے بندوبست کے حساب سے بدل سکتا ہے۔ ضرورت ہو تو اپنے معاملے کے لیے مدد لیں۔ |
| `rights.reporting.body` | اس ایپ میں آپ گمنام، رازدارانہ یا نام کے ساتھ رپورٹ کر سکتے ہیں۔ بعد کی قانونی کارروائی میں رازداری کے اصول مختلف ہو سکتے ہیں۔ | "رازدارانہ" less common than "خفیہ"; OK but formal. | اس ایپ میں آپ گمنام، خفیہ یا نام کے ساتھ رپورٹ کر سکتے ہیں۔ بعد کی قانونی کارروائی میں رازداری کے اصول مختلف ہو سکتے ہیں۔ |
| `rights.source.iloVoice` | خواتین کپاس مزدوروں کی آئی ایل او روداد | "روداد" awkward. | خواتین کپاس مزدوروں پر آئی ایل او رپورٹ |
| `rights.wages.body` | آپ کو پوری، وقت پر اور درست حساب سے اجرت ملنی چاہیے، بغیر غیر واضح کٹوتی کے۔ | Last clause is unnatural. | آپ کو پوری اجرت وقت پر اور درست حساب سے ملنی چاہیے۔ غیر واضح کٹوتی نہیں ہونی چاہیے۔ |
| `rights.wages.warning.1` | ادائیگی دیر سے ہو، کچھ رقم روک لی جائے، طے شدہ سے کم اجرت ملے یا درمیان والا رقم رکھ لے۔ | "درمیان والا رقم" wrong gender/case. | ادائیگی دیر سے ہو، کچھ رقم روک لی جائے، طے شدہ سے کم اجرت ملے یا بیچ والا شخص رقم رکھ لے۔ |
| `rights.wages.province.Sindh` | خواتین زرعی مزدوروں کو اسی کام کی برابر اجرت اور مقررہ کم از کم اجرت سے کم نہ ملنے کا حق ہے۔ | Heavy but okay. | خواتین زرعی مزدوروں کو ایک جیسے کام کی برابر اجرت اور کم از کم اجرت سے کم نہ ملنے کا حق ہے۔ |
| `rights.pesticide.body` | سپرے کرنے والے اور کپاس چننے والے تازہ سپرے، باقی زہر، ہوا اور غلط بوتل سے بیمار ہو سکتے ہیں۔ | "ہوا" too vague. | سپرے کرنے والے اور کپاس چننے والے تازہ سپرے، باقی زہر، زہریلی ہوا یا غلط بوتل سے بیمار ہو سکتے ہیں۔ |
| `rights.pesticide.guidance.1` | مزدور کو سپرے کی خبر، دوبارہ کھیت میں داخل ہونے کا محفوظ وقت، مناسب بچاؤ، دھونے کا پانی اور واضح ہدایات ملنی چاہئیں۔ | "سپرے کی خبر" wrong context. | مزدور کو سپرے کی اطلاع، کھیت میں دوبارہ داخل ہونے کا محفوظ وقت، حفاظتی سامان، دھونے کا پانی اور واضح ہدایات ملنی چاہئیں۔ |
| `rights.pesticide.warning.2` | سپرے سے پہلے خبر نہ دینا، تازہ سپرے والے کھیت میں بھیجنا، دھونے کا پانی نہ ہونا یا زہر کی بوتل دوبارہ استعمال کرنا۔ | "خبر" again wrong. | سپرے سے پہلے اطلاع نہ دینا، تازہ سپرے والے کھیت میں بھیجنا، دھونے کا پانی نہ ہونا یا زہر کی بوتل دوبارہ استعمال کرنا۔ |
| `rights.pesticide.action.2` | سانس میں دقت، بے ہوشی، الجھن، بار بار الٹی یا آنکھ میں شدید زہر پر فوری طبی مدد لیں۔ | "آنکھ میں شدید زہر" unnatural. | سانس میں دقت، بے ہوشی، الجھن، بار بار الٹی یا آنکھ میں زہر جانے پر فوری طبی مدد لیں۔ |
| `rights.heat.body` | کام اس طرح جاری نہیں رہنا چاہیے کہ شدید گرمی کا خطرہ بنے یا ضروری آرام نہ ملے۔ | Fine meaning, but "جاری" can be okay in sentence. | ایسا کام نہیں کروانا چاہیے جس سے شدید گرمی کا خطرہ ہو یا ضروری آرام نہ ملے۔ |
| `rights.heat.warning.2` | زبردستی اضافی وقت، وقفہ یا سایہ نہ دینا، یا بیماری اور خطرناک گرمی میں کام جاری رکھنے کا دباؤ۔ | Good meaning but smoother. | زبردستی اضافی وقت، وقفہ یا سایہ نہ دینا، یا بیماری اور خطرناک گرمی میں کام کروانے کا دباؤ۔ |
| `rights.injury.warning.1` | خون بہنا، کیڑے کا کاٹنا، بجلی کا خطرہ، بغیر حفاظتی ڈھال مشین یا غیر محفوظ سفر۔ | "کیڑے کا کاٹنا" odd. | خون بہنا، کیڑے یا جانور کا کاٹنا، بجلی کا خطرہ، حفاظتی ڈھال کے بغیر مشین یا غیر محفوظ سفر۔ |
| `rights.equality.guidance.1` | تحفظ میں جسمانی، زبانی اور جنسی حرکت کے ساتھ دھمکانا اور کام سے متعلق بدلہ بھی شامل ہے۔ | "جنسی حرکت" wrong/awkward. | تحفظ میں جسمانی، زبانی اور جنسی ہراسانی، دھمکی اور کام سے متعلق بدلہ بھی شامل ہے۔ |
| `rights.equality.guidance.2` | برابر سلوک میں جنس یا دوسری محفوظ بنیادوں کے بغیر امتیاز برابر اجرت اور موقع شامل ہیں۔ | Grammatically broken. | برابر سلوک میں جنس یا کسی اور بنیاد پر امتیاز کے بغیر برابر اجرت اور برابر موقع شامل ہیں۔ |
| `rights.child.body` | کام سے بچے کو خطرہ، جبری مزدوری یا تعلیم کا نقصان نہیں ہونا چاہیے۔ | Awkward list. | کام سے بچے کی صحت، حفاظت یا تعلیم کو نقصان نہیں ہونا چاہیے، اور بچے سے جبری مزدوری نہیں کروائی جا سکتی۔ |
| `rights.child.province.Punjab` | سولہ سال سے کم عمر بچہ شمار ہوتا ہے۔ | Incomplete legal wording. | سولہ سال سے کم عمر فرد بچہ شمار ہوتا ہے۔ |
| `rights.facilities.body` | صاف پینے کا پانی، سایہ، دھونے اور باعزت بیت الخلا تک رسائی محفوظ کھیت کے کام کا حصہ ہیں۔ | "دھونے" needs object. | صاف پینے کا پانی، سایہ، ہاتھ منہ دھونے کی جگہ اور باعزت بیت الخلا محفوظ کھیت کے کام کا حصہ ہیں۔ |
| `rights.facilities.story.2.body` | اسپرے یا غیر محفوظ نہری ڈبے سے پانی نہ پئیں۔ | "نہری ڈبے" unclear. | سپرے والی بوتل یا غیر محفوظ برتن سے پانی نہ پئیں۔ |
| `rights.facilities.guidance.1` | سہولت حقیقت میں استعمال کے قابل ہو... | "حقیقت میں" literal. | سہولت واقعی استعمال کے قابل ہو... |
| `rights.contract.body` | کام دلانے والا نرخ، کٹوتی، قرض یا ادائیگی کی ذمہ داری نہیں چھپا سکتا۔ | Good, but "نرخ" may be less familiar. | کام دلانے والا مزدوری، کٹوتی، قرض یا ادائیگی کی ذمہ داری نہیں چھپا سکتا۔ |
| `rights.maternity.body` | حمل، زچگی یا نگہداشت کی ضرورت کو زیادتی یا امتیاز کا بہانہ نہیں بنایا جا سکتا۔ | "زیادتی" too broad. | حمل، زچگی یا دیکھ بھال کی ضرورت کو بدسلوکی یا امتیاز کا بہانہ نہیں بنایا جا سکتا۔ |
| `rights.voice.body` | مزدور مشترکہ مسئلہ مل کر اٹھائیں تو زیادہ محفوظ اور مؤثر ہو سکتے ہیں۔ | Good but slightly formal. | مزدور مل کر مشترکہ مسئلہ اٹھائیں تو زیادہ محفوظ اور مؤثر ہو سکتے ہیں۔ |
| `rights.compensation.body` | کام کی چوٹ یا بیماری درج ہونی چاہیے اور علاج و معاوضے کے لیے دیکھی جانی چاہیے۔ | "دیکھی جانی چاہیے" weak/odd. | کام سے لگنے والی چوٹ یا بیماری درج ہونی چاہیے تاکہ علاج اور معاوضے کا جائزہ ہو سکے۔ |
| `rights.compensation.story.3.body` | ادائیگی کی ضمانت سمجھے بغیر کیس رپورٹ کریں۔ | Too legal/defensive, can discourage. | یہ سمجھ کر رپورٹ کریں کہ پہلے کیس کا جائزہ ہوگا؛ ادائیگی کی ضمانت نہیں دی جا سکتی۔ |
| `rights.migrant.body` | مہاجر حیثیت، رہائش، مزارعت یا فصل کی شراکت کو دھمکی یا امتیاز کا بہانہ نہیں بنایا جا سکتا۔ | Good but formal. | مہاجر ہونا، رہائش، مزارعت یا فصل کا حصہ دھمکی یا امتیاز کا بہانہ نہیں بن سکتا۔ |
| `rights.migrant.province.Sindh` | ... دوسرے مزارعتی سوال ماہر مدد مانگ سکتے ہیں۔ | Subject is wrong: questions do not ask. | ... دوسرے مزارعتی معاملات میں ماہر مدد چاہیے ہو سکتی ہے۔ |

## Web Portal Module

Portal Urdu should be professional, but still consistent. It currently mixes English admin vocabulary, Roman product terms, and literal translations.

| Key | Current Urdu | Issue | Recommended Urdu |
|---|---|---|---|
| `portal.role` | پی یو ڈبلیو ایف گریونس مینیجر | "گریونس" is awkward transliteration. | پی یو ڈبلیو ایف شکایت مینیجر |
| `portal.case.title` | گریونس کیس | Same issue. | شکایت کا کیس |
| `portal.dashboard.empty` | ریپوزٹری میں ابھی کوئی شکایت نہیں۔ | "Repository" is developer language. | ریکارڈ میں ابھی کوئی شکایت نہیں۔ |
| `portal.dashboard.note` | فوری رپورٹس دیکھیں، فالو اپ کریں اور جاری کیسوں کی نگرانی کریں۔ | Mixed "follow-up"; "جاری کیس" can improve. | فوری رپورٹس دیکھیں، رابطہ کریں اور زیرِ کارروائی کیسوں کی نگرانی کریں۔ |
| `portal.status.Submitted` | جمع | Incomplete status. | جمع ہو گئی |
| `portal.status.Reopened` | دوبارہ کھلی | Gender issue if "case" masculine. | دوبارہ کھولا گیا |
| `portal.priority.Critical` | تنقیدی | Wrong for risk severity; means analytical/critical thinking. | سنگین |
| `portal.priority.High` | اونچی | Wrong register for priority. | زیادہ |
| `portal.priority.Standard` | معیاری | OK for quality, not priority. | معمول کے مطابق |
| `portal.kpi.critical` | تنقیدی | Same severity issue. | سنگین |
| `portal.analytics.kpi.criticalRate` | تنقیدی شرح | Same issue. | سنگین کیسوں کی شرح |
| `portal.case.updated` | اپ ڈیٹ | OK if product Urdu, but use consistently with mobile. | تازہ اپ ڈیٹ |
| `portal.case.reporter` | رپورٹر | Better in context. | رپورٹ کرنے والا |
| `portal.case.transcript` | اردو ٹرانسکرپٹ | Mixed technical word. | اردو متن |
| `portal.case.noTranscript` | ٹرانسکرپٹ نہیں۔ | Same issue. | اردو متن دستیاب نہیں۔ |
| `portal.case.ai` | AI تجزیہ | Could be acceptable for staff; if fully Urdu then revise. | خودکار تجزیہ |
| `portal.case.suggestedPriority` | Suggested Priority | English in Urdu UI. | تجویز کردہ ترجیح |
| `portal.case.extractedFacts` | Extracted Facts | English in Urdu UI. | نکالی گئی معلومات |
| `portal.case.humanReview` | Human Review Required | English in Urdu UI. | انسانی جائزہ درکار |
| `portal.case.confidence` | AI اعتماد | Awkward. | خودکار تجزیے کا اعتماد |
| `portal.case.facts.none` | نکالے گئے حقائق نہیں۔ | Unnatural. | نکالی گئی معلومات موجود نہیں۔ |
| `portal.case.timeline` | ٹائم لائن | Common but can be Urdu. | کارروائی کی ترتیب |
| `portal.case.actions` | اعمال | Wrong for UI actions. | کارروائیاں |
| `portal.case.action.resolve` | حل شدہ | Button should be verb. | حل شدہ نشان لگائیں |
| `portal.case.event.reopened` | دوبارہ کھلی | Gender issue. | دوبارہ کھولا گیا |
| `portal.analytics.note` | کل ریپوزٹری سے ہیں۔ تعداد کارکردگی کا سکور نہیں۔ | Developer/register issue. | تمام اعداد ریکارڈ سے لیے گئے ہیں۔ تعداد کارکردگی کا اسکور نہیں۔ |
| `portal.analytics.kpi.open` | کھلے | Better as cases. | کھلے کیس |
| `portal.analytics.kpi.resolutionTime` | اوسط حل | Incomplete. | حل تک اوسط وقت |
| `portal.analytics.outcome.unresolved` | حل نہیں | Better label. | حل نہیں ہوا |
| `portal.analytics.ai.high` | اونچا | For confidence. | زیادہ |
| `portal.analytics.review.no` | ضروری نہیں | Better context. | درکار نہیں |
| `portal.gender.Other` | دیگر | For people, better. | کوئی اور |
| `portal.gender.Not Stated` | بیان نہیں | Incomplete. | نہیں بتایا گیا |
| `portal.chart.privacy` | رازداری کی صورت | Awkward. | رازداری کی قسم |
| `portal.chart.aiConfidence` | AI اعتماد | Awkward. | خودکار تجزیے کا اعتماد |
| `portal.demo.body` | صرف ڈیمو ٹولز۔ آلات ہم آہنگ نہیں ہوتے۔ | "devices do not sync" too literal. | صرف ڈیمو ٹولز۔ موبائل اور ویب خودکار طور پر ہم آہنگ نہیں ہوتے۔ |
| `portal.demo.resetConfirm` | اصل سیڈ واپس لائیں اور ڈیمو فلیگ صاف کریں؟ | Developer terms. | اصل ڈیمو ڈیٹا واپس لائیں اور عارضی حالتیں صاف کریں؟ |
| `portal.demo.scenario` | سیناریو | Use Urdu. | مثال کیس |
| `portal.demo.bridgeNote` | موبائل اور ویب ایک ہی سیناریو الگ الگ لوڈ کرتے ہیں۔ یہ لائیو سنک نہیں۔ | Mixed and technical. | موبائل اور ویب ایک ہی مثال کیس الگ الگ لوڈ کرتے ہیں۔ یہ براہِ راست ہم آہنگی نہیں ہے۔ |
| `portal.demo.load` | سیناریو لوڈ | Mixed. | مثال کیس لوڈ کریں |
| `portal.demo.advanceCase` | کیس آگے | Incomplete. | کیس آگے بڑھائیں |
| `portal.demo.advanceTracking` | ٹریکنگ آگے | Incomplete. | ٹریکنگ آگے بڑھائیں |
| `portal.demo.aiFailureOn` | AI ناکامی فرض کریں | Awkward. | خودکار تجزیے کی ناکامی فرض کریں |
| `portal.demo.lowConfidenceOn` | کم اعتماد فرض کریں | Ambiguous. | کم اعتماد والی حالت فرض کریں |
| `portal.demo.delayOn` | AI تاخیر فرض کریں | Awkward. | خودکار تجزیے میں تاخیر فرض کریں |

## Demo, Mock Data, and AI Scenario Strings

These are not all production-facing, but they appear in demo mode and can leak into screenshots.

| Location or key | Current Urdu | Issue | Recommended Urdu |
|---|---|---|---|
| `packages/ai/src/scenarioOutputs.ts` | آواز ملا جلا ہے۔ | Gender/grammar issue. | آواز ملی جلی ہے۔ |
| `demo.gs01` | اجرت کم ادا | Incomplete. | کم اجرت ادا ہوئی |
| `demo.gs02` | کیڑے مار ہنگامی | Grammatically broken. | سپرے کی ہنگامی شکایت |
| `demo.gs03` | خفیہ ہراساں | Broken phrase. | خفیہ ہراسانی |
| `demo.gs07` | صفائی پانی | Broken phrase. | پانی اور صفائی |
| `demo.gs08` | AI کم اعتماد | Awkward. | خودکار تجزیہ: کم اعتماد |
| `demo.gs09` | AI ناکامی | Awkward. | خودکار تجزیہ ناکام |
| `demo.gs10` | دوبارہ کھلا کیس | Acceptable but better. | دوبارہ کھولا گیا کیس |
| `demo.mobile.reconnect` | دوبارہ جڑنا فرض کریں | Awkward. | دوبارہ رابطہ بحال فرض کریں |
| `demo.mobile.queueOne` | ایک شکایت قطار میں ڈالیں | Mechanical. | ایک شکایت انتظار کی قطار میں رکھیں |
| `demo.mobile.process` | قطار چلائیں | Mechanical. | انتظار کی قطار پر کارروائی کریں |
| `demo.mobile.waiting` | محفوظ رپورٹیں انتظار میں | Better. | محفوظ رپورٹس انتظار میں ہیں |
| `packages/mock-data/src/scenarios/GS08_AILowConfidence.ts` | بیان میں شور اور مختلف زبانیں ہیں، اس لیے شکایت کی قسم کے بارے میں یقین نہیں۔ | Better as system explanation. | بیان میں شور ہے اور مختلف زبانیں شامل ہیں، اس لیے شکایت کی قسم واضح نہیں۔ |

## Terms to Standardize

Use these consistently across mobile and portal:

| Concept | Recommended Urdu |
|---|---|
| Complaint/report from worker | شکایت or رپورٹ, but use `شکایت` for case tracking and `رپورٹ` for submission action |
| Case update | اپ ڈیٹ or تازہ اپ ڈیٹ, not `خبر` |
| Needs attention | جواب درکار or توجہ طلب, not `آپ کی ضرورت` |
| In progress | زیرِ کارروائی or کارروائی جاری ہے, not standalone `جاری` |
| Critical severity | سنگین, not `تنقیدی` |
| High priority | زیادہ, not `اونچی` |
| Standard priority | معمول کے مطابق, not `معیاری` |
| Grievance manager/case | شکایت مینیجر / شکایت کا کیس, not `گریونس` |
| Transcript | اردو متن or صوتی بیان کا متن, not `ٹرانسکرپٹ` for worker-facing UI |
| Scenario | مثال کیس, not `سیناریو` unless strictly internal |
| AI | For worker UI use `خودکار خلاصہ/خودکار تجزیہ`; portal can show AI as secondary if needed |
| Other | کوئی اور, not `اور` |
| Privacy mode confidential | خفیہ, not necessarily `رازدارانہ` in worker UI |

## Implementation Notes

1. Update `packages/localization/src/locales/ur.json` first.
2. Sync the exact same changes to `apps/mobile/src/i18n/locales/ur.json` or use the existing sync/test mechanism if one exists.
3. Update tests that assert exact Urdu strings, currently including `packages/localization/src/index.test.ts`.
4. Regenerate or invalidate Urdu voice-over prompts if any of these strings are part of the approved audio catalog.
5. Run mobile and portal screenshots after copy changes because Urdu line height and card text wrapping will change.

