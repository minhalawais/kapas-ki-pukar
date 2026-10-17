#!/usr/bin/env node
/* global AbortSignal, Buffer, console, fetch, process, setTimeout */

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const LOCALE_PATH = path.join(ROOT, "packages/localization/src/locales/ur.json");
const RIGHTS_PATH = path.join(ROOT, "packages/mock-data/src/rightsTopics.ts");
const WORKFLOW_DIR = path.join(ROOT, "packages/domain/src/workflows");
const AUDIO_DIR = path.join(ROOT, "apps/mobile/assets/audio/ur");
const PROVENANCE_DIR = path.join(AUDIO_DIR, ".provenance");
const STAGING_DIR = path.join(__dirname, ".staging");
const MANIFEST_PATH = path.join(__dirname, "prompts.json");
const REVIEW_PATH = process.env.VOICE_REVIEW_PATH
  ? path.resolve(process.env.VOICE_REVIEW_PATH)
  : path.join(__dirname, "review.json");
const SPEECH_REGISTRY_PATH = path.join(ROOT, "packages/speech/src/promptManifest.ts");
const ASSET_REGISTRY_PATH = path.join(ROOT, "apps/mobile/src/services/generatedPromptAssets.ts");

const MODEL = "gemini-2.5-flash-preview-tts";
const VOICE = "Sulafat";
const VALIDATION_IDS = ["SC-welcome", "WF-identity", "WF-wag-pay", "WF-pes-sym", "WF-har-about"];
const MASTERING_PROFILE = "mp3-24khz-mono-64k-loudnorm-i-18-tp-2-trim-start-pad-1s-v4";
const ROTATION_STATE_PATH = path.join(__dirname, ".rotation-state.json");
const KEY_DAILY_LIMIT = Math.max(1, Number(process.env.VOICE_KEY_DAILY_LIMIT || 10));
const REQUEST_INTERVAL_MS = Math.max(
  0,
  Number(process.env.VOICE_REQUEST_INTERVAL_MS || (process.argv.includes("--rotate") ? 21000 : 6500)),
);

const STYLE_PROMPT = [
  "Speak only the supplied Urdu transcript, exactly as written, without adding an introduction or commentary.",
  "Use natural, professional Pakistani Urdu in a warm, mature worker-support voice.",
  "The listener may have low literacy and may be outdoors, so articulate clearly at a calm, moderately slow pace.",
  "Sound respectful and reassuring, never theatrical, cheerful, judgmental, bureaucratic, or patronizing.",
  "Use short natural pauses at Urdu sentence endings. Keep sensitive safety questions calm and serious.",
  "Use Pakistani Urdu pronunciation rather than Hindi-influenced pronunciation. Do not omit, paraphrase, translate, or invent words.",
].join(" ");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

function parseArgs(argv) {
  const command = argv[0] || "generate";
  const options = {
    command,
    scope: undefined,
    limit: Number(process.env.VOICE_DAILY_LIMIT || Infinity),
    force: false,
    validation: false,
    rotate: false,
    reviewer: undefined,
  };
  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") continue;
    if (arg === "--force") options.force = true;
    else if (arg === "--validation") options.validation = true;
    else if (arg === "--rotate") options.rotate = true;
    else if (arg === "--scope") options.scope = argv[++index];
    else if (arg === "--limit") options.limit = Number(argv[++index]);
    else if (arg === "--reviewer") options.reviewer = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!["generate", "status", "validate", "credentials", "verify", "sync", "remaster", "approve-validation", "approve-audio"].includes(command)) throw new Error(`Unknown command: ${command}`);
  if (options.scope && !["screens", "workflow", "rights"].includes(options.scope)) throw new Error("--scope must be screens, workflow, or rights");
  if (!Number.isFinite(options.limit) && options.limit !== Infinity || options.limit < 1) throw new Error("--limit must be a positive number");
  return options;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sourceFile(file) {
  return ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
}

function property(object, name) {
  return object.properties.find((item) => ts.isPropertyAssignment(item) && item.name.getText().replaceAll(/["']/g, "") === name)?.initializer;
}

function stringValue(node) {
  return node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;
}

function stringArray(node) {
  return node && ts.isArrayLiteralExpression(node) ? node.elements.map(stringValue).filter(Boolean) : [];
}

function topLevelObjects(file) {
  const found = [];
  sourceFile(file).forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      const initializer = declaration.initializer;
      if (initializer && ts.isArrayLiteralExpression(initializer)) {
        found.push(...initializer.elements.filter(ts.isObjectLiteralExpression));
      }
    }
  });
  return found;
}

function translated(ur, key) {
  const value = ur[key];
  if (typeof value !== "string") throw new Error(`Missing Urdu localization key: ${key}`);
  return value.trim();
}

function sentence(value) {
  const clean = value.trim();
  return /[۔؟!]$/.test(clean) ? clean : `${clean}۔`;
}

function fileName(id) {
  return `${id.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "")}.mp3`;
}

const workflowOverrides = {
  identity: "سب سے پہلے شناخت کا طریقہ منتخب کریں۔ آپ اپنا شناختی کارڈ نمبر، اپنا موبائل نمبر، یا گمنام رپورٹ کرنے میں سے انتخاب کر سکتے ہیں۔",
  intro: "یہاں آپ کام سے متعلق مسئلہ محفوظ طریقے سے بتا سکتے ہیں۔ ایک وقت میں ایک سوال پوچھا جائے گا، اور آپ اپنی شناخت چھپا سکتے ہیں۔",
  category: "آپ کس مسئلے کے بارے میں رپورٹ کرنا چاہتے ہیں؟ اجرت، سپرے، چوٹ، ہراسانی، بال مزدوری، یا زبردستی کام میں سے مناسب تصویر چنیں۔ مزید اقسام یا دیگر مسئلے کے لیے نیچے والے بٹن دیکھیں۔",
  "category-more": "اپنے مسئلے کی قسم چنیں۔ ٹھیکیدار، کام کے گھنٹے، پانی یا بیت الخلا، ناانصافی، یا کوئی اور مسئلہ۔",
  voice: "اپنے الفاظ میں بتائیں کہ کیا ہوا۔ ریکارڈنگ لازمی نہیں؛ اگر بولنا محفوظ نہ لگے تو آپ اسے چھوڑ کر آگے بڑھ سکتے ہیں۔",
  "where-current": "یہ واقعہ کہاں ہوا؟ اگر آپ ابھی اسی جگہ کے قریب ہیں تو موجودہ مقام استعمال کر سکتے ہیں۔ ورنہ جگہ خود لکھیں۔ مقام صرف آپ کی اجازت کے بعد لیا جائے گا۔",
  "danger-notice": "یہ رپورٹ فوری نوعیت کی ہے۔ اگر محفوظ ہو تو پہلے خطرے والی جگہ سے دور ہو جائیں اور فوری مقامی مدد حاصل کریں۔ کپاس کی پکار آپ کی رپورٹ کو ترجیحی طور پر دکھائے گی۔",
  danger: "کیا ابھی کسی شخص کو فوری خطرہ ہے؟ اگر ہاں، اور ممکن ہو، تو پہلے محفوظ جگہ پر جائیں۔",
  privacy: "آپ کی شناخت کیسے رکھی جائے؟ جواب کے لیے گمنام، خفیہ، یا شناخت کے ساتھ میں سے انتخاب کریں۔",
  evidence: "اگر محفوظ ہو تو تصویر یا دستاویز شامل کر سکتے ہیں۔ یہ لازمی نہیں، اور آپ اسے چھوڑ سکتے ہیں۔",
  contact: "کیا آپ سے رابطہ کرنا محفوظ ہے؟ جواب کے لیے کال محفوظ، پیغام محفوظ، صرف کال، پیغام نہ بھیجیں، یا رابطہ نہ کریں میں سے انتخاب کریں۔",
  "ai-processing": "آپ کی دی ہوئی معلومات سمجھی جا رہی ہیں۔ براہ کرم چند لمحے انتظار کریں۔",
  "ai-understanding": "خلاصہ سن یا پڑھ کر دیکھیں۔ اگر بات درست ہے تو تصدیق کریں، ورنہ واپس جا کر بدلیں۔",
  review: "اپنی رپورٹ جمع کرانے سے پہلے معلومات دیکھ لیں۔ ضرورت ہو تو کسی حصے کو بدلیں، پھر جمع کرائیں۔",
  "har-about": "کس قسم کا سلوک ہوا؟ جواب کے لیے گالی یا دھمکی، جنسی بات یا اشارہ، ناپسندیدہ چھونا، پیچھا کرنا، بدلے کی دھمکی، یا کوئی اور بات چنیں۔ صرف اتنا بتائیں جتنا آپ کو محفوظ لگے۔",
  "har-present": "کیا وہ شخص ابھی آپ کو نقصان پہنچا سکتا ہے؟ اگر ہاں تو پہلے اپنی حفاظت کو ترجیح دیں۔",
  "har-female": "کیا آپ خاتون نمائندے سے بات کرنا پسند کریں گے؟ یہ انتخاب آپ کا ہے۔",
  "pes-what": "سپرے یا کیمیکل کے ساتھ کیا مسئلہ ہوا؟ جواب کے لیے طبیعت خراب ہونا، فوراً کام کرنا، حفاظتی سامان نہ ملنا، کیمیکل گرنا، قریبی کھیت سے بو، کیمیکل ملانا، یا کوئی اور مسئلہ چنیں۔",
  "pes-sym": "کیا کوئی علامت ہے؟ جواب کے لیے سانس میں دشواری، چکر، قے، جلن، بے ہوشی، کوئی اور علامت، یا کوئی علامت نہیں چنیں۔ شدید حالت میں پہلے طِبّی مدد لیں۔",
  "pes-med": "کیا طِبّی مدد ملی؟ جواب کے لیے ہاں، فوری طِبّی مدد چاہیے، طِبّی مدد مل گئی، یا ابھی طِبّی مدد نہیں ملی چنیں۔",
  "chl-who": "یہ کس کے بارے میں ہے؟ جواب کے لیے میں خود، میرا بچہ، گھر کا بچہ، کوئی اور، یا بتانا محفوظ نہیں میں سے انتخاب کریں۔",
  "chl-risk": "کیا ابھی کوئی خطرہ ہے؟ اگر ہاں تو پہلے محفوظ جگہ پر جائیں اور قابل اعتماد شخص کی مدد لیں۔",
  "fol-forced": "کیا کسی شخص سے اس کی مرضی کے خلاف کام کروایا جا رہا ہے؟ آپ نام بتائے بغیر جواب دے سکتے ہیں۔",
  "fol-threats": "کیا کام نہ کرنے پر دھمکی، سزا، مارپیٹ، یا نقصان کا خوف ہے؟",
  "fol-debt": "کیا قرض، روکی ہوئی اجرت، شناختی کاغذ رکھنے، یا آنے جانے کی پابندی کے ذریعے کام پر مجبور کیا جا رہا ہے؟",
  "fol-leave": "کیا وہ شخص اپنی مرضی سے کام یا رہنے کی جگہ چھوڑ سکتا ہے؟",
  "con-what": "ٹھیکیدار کا کیا مسئلہ ہے؟ جواب کے لیے ادائیگی، دھمکی، بھرتی فیس یا قرض، جھوٹا وعدہ، کام کی حالت، کاغذات رکھنا، آمدورفت روکنا، یا کوئی اور چنیں۔",
  "dis-what": "ناانصافی کس قسم کی ہے؟ جواب کے لیے جنس، برادری، مہاجر ہونا، عمر، معذوری، حمل، شکایت کرنا، یا کوئی اور وجہ چنیں۔",
  "hse-what": "حفاظت کا کیا مسئلہ ہے؟ جواب کے لیے چوٹ، غیر محفوظ سامان، گرمی، آمدورفت، پانی یا آرام نہ ملنا، طِبّی امداد نہ ملنا، یا کوئی اور چنیں۔",
  "where-province": "کون سا صوبہ یا علاقہ؟ جواب کے لیے پنجاب، سندھ، خیبر پختونخوا، بلوچستان، اسلام آباد، گلگت بلتستان، یا آزاد کشمیر چنیں۔",
};

function extraCatalog() {
  return [
    {
      id: "WF-identity-cnic",
      scope: "workflow",
      ref: "identity-cnic",
      file: fileName("WF-identity-cnic"),
      scriptUrdu: "اپنا 13 ہندسوں کا قومی شناختی کارڈ نمبر لکھیں اور آگے بڑھیں کا بٹن دبائیں۔",
      tone: "guided-question",
    },
    {
      id: "WF-identity-phone",
      scope: "workflow",
      ref: "identity-phone",
      file: fileName("WF-identity-phone"),
      scriptUrdu: "اپنا 11 ہندسوں کا موبائل نمبر لکھیں اور آگے بڑھیں کا بٹن دبائیں۔",
      tone: "guided-question",
    },
  ];
}

function workflowCatalog(ur) {
  const files = fs.readdirSync(WORKFLOW_DIR)
    .filter((name) => name.endsWith(".ts") && name !== "index.ts")
    .sort();
  const prompts = [];
  for (const file of files) {
    for (const object of topLevelObjects(path.join(WORKFLOW_DIR, file))) {
      const id = stringValue(property(object, "id"));
      const promptKey = stringValue(property(object, "promptKey"));
      if (!id || !promptKey) continue;
      const helperKey = stringValue(property(object, "helperKey"));
      const optionsNode = property(object, "options");
      const optionKeys = optionsNode && ts.isArrayLiteralExpression(optionsNode)
        ? optionsNode.elements.filter(ts.isObjectLiteralExpression).map((option) => stringValue(property(option, "labelKey"))).filter(Boolean)
        : [];
      let scriptUrdu = workflowOverrides[id];
      if (!scriptUrdu) {
        const pieces = [sentence(translated(ur, promptKey))];
        if (helperKey) pieces.push(sentence(translated(ur, helperKey)));
        if (optionKeys.length > 1 && optionKeys.length <= 10) {
          pieces.push(`جواب کے لیے ${optionKeys.map((key) => translated(ur, key)).join("، ")} میں سے انتخاب کریں۔`);
        }
        scriptUrdu = pieces.join(" ");
      }
      prompts.push({ id: `WF-${id}`, scope: "workflow", ref: id, file: fileName(`WF-${id}`), scriptUrdu, tone: id.startsWith("har-") || id.startsWith("chl-") || id.startsWith("fol-") ? "safeguarding" : "guided-question" });
    }
  }
  return prompts;
}

function rightsCatalog(ur) {
  const prompts = [];
  for (const object of topLevelObjects(RIGHTS_PATH)) {
    const id = stringValue(property(object, "id"));
    const titleKey = stringValue(property(object, "titleKey"));
    const bodyKey = stringValue(property(object, "bodyKey"));
    if (!id || !titleKey || !bodyKey) continue;
    const groups = {
      overview: [titleKey, bodyKey],
      guidance: stringArray(property(object, "guidanceKeys")),
      warning: stringArray(property(object, "warningKeys")),
      action: stringArray(property(object, "actionKeys")),
    };
    for (const [section, keys] of Object.entries(groups)) {
      const prefix = section === "guidance" ? "یاد رکھنے کی باتیں۔ " : section === "warning" ? "خبردار کرنے والی نشانیاں۔ " : section === "action" ? "اب آپ کیا کر سکتے ہیں۔ " : "";
      prompts.push({ id: `RT-${id}-${section}`, scope: "rights", ref: id, section, file: fileName(`RT-${id}-${section}`), scriptUrdu: prefix + keys.map((key) => sentence(translated(ur, key))).join(" "), tone: section === "warning" ? "calm-serious" : "rights-guide" });
    }
  }
  return prompts;
}

function screenCatalog() {
  return [
    ["SC-welcome", "welcome", "السلام علیکم۔ آگے بڑھنے کے لیے اپنی زبان چنیں۔ وہ زبان منتخب کریں جسے پڑھنا اور سننا آپ کے لیے آسان ہو۔", "warm-welcome"],
    ["SC-home", "home", "السلام علیکم۔ کپاس کی پکار میں خوش آمدید۔ یہ سہولت کپاس کے شعبے میں کام کرنے والے مزدوروں کے لیے، بین الاقوامی ادارہ محنت، یعنی آئی ایل او، کے تعاون سے تیار کی گئی ہے۔ یہاں آپ آسان اور مرحلہ وار سوالوں کے جواب دے کر اجرت، کام کی حفاظت، ہراسانی، امتیازی سلوک، یا کام سے متعلق کسی دوسرے مسئلے کی شکایت درج کر سکتے ہیں۔ آپ اپنی درج کی گئی شکایت کی تازہ صورتِ حال دیکھ سکتے ہیں اور اپنے بنیادی حقوق کے بارے میں آسان اور مفید رہنمائی حاصل کر سکتے ہیں۔ آپ کی فراہم کردہ معلومات عزت، احتیاط اور ذمہ داری کے ساتھ سنبھالی جائیں گی۔ اب آپ کیا کرنا چاہتے ہیں؟ مسئلہ بتانے، اپنی شکایت دیکھنے، یا اپنے حقوق جاننے کے لیے متعلقہ بٹن دبائیں۔", "warm-guide"],
    ["SC-permission", "permission", "اپنی بات ریکارڈ کرنے کے لیے مائیک کی اجازت دیں۔ ریکارڈنگ صرف آپ کے دبانے پر شروع ہوگی، اور آپ بغیر ریکارڈنگ کے بھی آگے بڑھ سکتے ہیں۔", "privacy"],
    ["SC-success", "success", "آپ کی رپورٹ موصول ہو گئی ہے۔ شکایت کا نمبر محفوظ رکھیں تاکہ آپ بعد میں پیش رفت دیکھ سکیں۔", "calm-success"],
    ["SC-offline", "offline", "آپ کی رپورٹ اس فون میں محفوظ ہے، لیکن ابھی بھیجی نہیں گئی۔ انٹرنیٹ ملنے پر دوبارہ کوشش کی جائے گی۔ رپورٹ کو حذف نہ کریں۔", "calm-warning"],
    ["SC-complaints", "complaints", "یہاں آپ اپنی شکایات کی موجودہ حالت، اگلا قدم، اور تازہ پیش رفت دیکھ سکتے ہیں۔ شکایت کھولنے کے لیے اس پر دبائیں۔", "informative"],
    ["SC-complaint-detail", "complaint-detail", "یہ آپ کی درج کردہ شکایت کی تفصیل ہے۔ یہاں آپ شکایت کی موجودہ صورتِ حال، اگلا قدم، اور جمع کروائی گئی معلومات دیکھ سکتے ہیں۔", "informative"],
    ["SC-rights-explorer", "rights", "اپنے حقوق کے بارے میں معلوم کریں۔ اجرت، سپرے، گرمی اور آرام، چوٹ، برابری، یا بچوں کے تحفظ میں سے مناسب آپشن منتخب کریں۔", "rights-guide"],
  ].map(([id, ref, scriptUrdu, tone]) => ({ id, scope: "screen", ref, file: fileName(id), scriptUrdu, tone }));
}

function buildCatalog() {
  const ur = readJson(LOCALE_PATH);
  const prompts = [...screenCatalog(), ...workflowCatalog(ur), ...extraCatalog(), ...rightsCatalog(ur)];
  const ids = new Set();
  for (const prompt of prompts) {
    if (ids.has(prompt.id)) throw new Error(`Duplicate voice prompt id: ${prompt.id}`);
    ids.add(prompt.id);
  }
  return prompts;
}

function provenancePath(prompt) {
  return path.join(PROVENANCE_DIR, `${prompt.file}.json`);
}

function readProvenance(prompt) {
  const file = provenancePath(prompt);
  if (!fs.existsSync(file)) return undefined;
  try {
    return readJson(file);
  } catch {
    return undefined;
  }
}

function expectedHashes(prompt) {
  return { scriptSha256: sha256(prompt.scriptUrdu), directionSha256: sha256(STYLE_PROMPT), masteringSha256: sha256(MASTERING_PROFILE) };
}

function stateFor(prompt) {
  const outputPath = path.join(AUDIO_DIR, prompt.file);
  const provenance = readProvenance(prompt);
  const expected = expectedHashes(prompt);
  if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size <= 1024) return { status: "missing", provenance };
  if (!provenance) return { status: "provisional", provenance };
  if (provenance.model !== MODEL || provenance.voice !== VOICE || provenance.scriptSha256 !== expected.scriptSha256 || provenance.directionSha256 !== expected.directionSha256 || provenance.fileSha256 !== sha256(fs.readFileSync(outputPath))) {
    return { status: "stale", provenance };
  }
  return { status: provenance.approvalStatus === "approved" ? "approved" : "generated", provenance };
}

function currentReview() {
  return fs.existsSync(REVIEW_PATH) ? readJson(REVIEW_PATH) : { model: MODEL, voice: VOICE, voiceValidation: { status: "pending", reviewer: null, reviewedAt: null }, validationPromptIds: VALIDATION_IDS };
}

function writeGeneratedFiles(prompts) {
  const workflow = Object.fromEntries(prompts.filter((p) => p.scope === "workflow" && !["identity-cnic", "identity-phone"].includes(p.ref)).map((p) => [p.ref, p.id]));
  const screens = Object.fromEntries(prompts.filter((p) => p.scope === "screen").map((p) => [p.ref, p.id]));
  const rights = {};
  for (const prompt of prompts.filter((p) => p.scope === "rights")) {
    rights[prompt.ref] ||= {};
    rights[prompt.ref][prompt.section] = prompt.id;
  }
  const states = Object.fromEntries(prompts.map((prompt) => [prompt.id, stateFor(prompt)]));
  const files = Object.fromEntries(prompts.map((p) => [p.id, p.file]));
  const bundled = prompts.filter((prompt) => {
    const outputPath = path.join(AUDIO_DIR, prompt.file);
    return fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1024;
  });
  const manifest = {
    version: "3.0.0",
    locale: "ur-PK",
    provider: "Google Gemini TTS",
    model: MODEL,
    voice: VOICE,
    directionSha256: sha256(STYLE_PROMPT),
    masteringProfile: MASTERING_PROFILE,
    audio: { encoding: "MP3", sampleRateHertz: 24000, channels: 1, bitrateKbps: 64, targetLufs: -18, truePeakDb: -2, targetDir: "apps/mobile/assets/audio/ur" },
    review: currentReview(),
    counts: Object.values(states).reduce((counts, state) => ({ ...counts, [state.status]: (counts[state.status] || 0) + 1 }), {}),
    prompts: prompts.map((prompt) => ({ ...prompt, scriptSha256: expectedHashes(prompt).scriptSha256, generationStatus: states[prompt.id].status, provenance: states[prompt.id].provenance ?? null })),
  };
  writeJsonAtomic(MANIFEST_PATH, manifest);

  const speechSource = `/* Generated by tooling/voice-prompts/generate.mjs. Do not edit manually. */\nexport const PROMPT_FILES = ${JSON.stringify(files, null, 2)} as const;\n\nexport const WORKFLOW_PROMPT_IDS = ${JSON.stringify(workflow, null, 2)} as const;\n\nexport const SCREEN_PROMPT_IDS = ${JSON.stringify(screens, null, 2)} as const;\n\nexport const RIGHTS_PROMPT_IDS = ${JSON.stringify(rights, null, 2)} as const;\n\nexport type PromptId = keyof typeof PROMPT_FILES;\n\nexport function isPromptId(value: string | undefined): value is PromptId {\n  return Boolean(value && value in PROMPT_FILES);\n}\n\nexport function workflowPromptId(nodeId: string): PromptId | undefined {\n  return WORKFLOW_PROMPT_IDS[nodeId as keyof typeof WORKFLOW_PROMPT_IDS];\n}\n\nexport function rightsPromptIds(topicId: string): readonly PromptId[] {\n  const sections = RIGHTS_PROMPT_IDS[topicId as keyof typeof RIGHTS_PROMPT_IDS];\n  return sections ? [sections.overview, sections.guidance, sections.warning, sections.action] : [];\n}\n`;
  const speechTemp = `${SPEECH_REGISTRY_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(speechTemp, speechSource);
  fs.renameSync(speechTemp, SPEECH_REGISTRY_PATH);

  const requires = bundled.map((prompt) => `  ${JSON.stringify(prompt.id)}: require(${JSON.stringify(`../../assets/audio/ur/${prompt.file}`)}) as number,`).join("\n");
  const lintStart = bundled.length ? "/* eslint-disable @typescript-eslint/no-require-imports */\n" : "";
  const lintEnd = bundled.length ? "/* eslint-enable @typescript-eslint/no-require-imports */\n" : "";
  const assetSource = `/* Generated by tooling/voice-prompts/generate.mjs. Metro requires static asset paths. */\nimport type { PromptId } from "@kapas/speech";\n\n${lintStart}export const BUNDLED_PROMPT_ASSETS: Partial<Record<PromptId, number>> = {\n${requires}\n};\n${lintEnd}`;
  const assetTemp = `${ASSET_REGISTRY_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(assetTemp, assetSource);
  fs.renameSync(assetTemp, ASSET_REGISTRY_PATH);
}

function loadEnv() {
  if (process.env.VOICE_IGNORE_DOTENV === "1") return {};
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return {};
  const values = {};
  for (const rawLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

function pacificDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function loadApiKeys() {
  const env = { ...loadEnv(), ...process.env };
  const keys = [];
  const seen = new Set();
  const add = (alias, value) => {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    keys.push({ alias, fingerprint: sha256(trimmed).slice(0, 12), value: trimmed });
  };
  add("GEMINI_TTS_API_KEY", env.GEMINI_TTS_API_KEY);
  for (let index = 1; index <= 20; index += 1) add(`GEMINI_API_KEY_${index}`, env[`GEMINI_API_KEY_${index}`]);
  add("GOOGLE_API_KEY", env.GOOGLE_API_KEY);
  return keys;
}

function apiKey() {
  const keys = loadApiKeys();
  if (!keys.length) {
    throw new Error("GEMINI_TTS_API_KEY is required. For rotation, also set GEMINI_API_KEY_1..N in .env and pass --rotate.");
  }
  return keys[0].value;
}

class KeyPool {
  constructor(keys, dailyLimit = KEY_DAILY_LIMIT) {
    this.keys = keys;
    this.dailyLimit = dailyLimit;
    this.datePacific = pacificDateString();
    this.state = this.loadState();
    this.currentIndex = this.state.currentIndex ?? 0;
  }

  loadState() {
    if (!fs.existsSync(ROTATION_STATE_PATH)) {
      return { datePacific: this.datePacific, keys: {}, currentIndex: 0, sessionGenerated: 0 };
    }
    try {
      const saved = readJson(ROTATION_STATE_PATH);
      if (saved.datePacific !== this.datePacific) {
        return { datePacific: this.datePacific, keys: {}, currentIndex: 0, sessionGenerated: 0 };
      }
      return {
        datePacific: this.datePacific,
        keys: saved.keys ?? {},
        currentIndex: saved.currentIndex ?? 0,
        sessionGenerated: saved.sessionGenerated ?? 0,
      };
    } catch {
      return { datePacific: this.datePacific, keys: {}, currentIndex: 0, sessionGenerated: 0 };
    }
  }

  saveState() {
    writeJsonAtomic(ROTATION_STATE_PATH, {
      datePacific: this.datePacific,
      keys: this.state.keys,
      currentIndex: this.currentIndex,
      sessionGenerated: this.state.sessionGenerated,
      updatedAt: new Date().toISOString(),
    });
  }

  entry(key) {
    if (!this.state.keys[key.fingerprint]) {
      this.state.keys[key.fingerprint] = {
        alias: key.alias,
        successes: 0,
        failures: 0,
        exhausted: false,
        exhaustedReason: null,
      };
    }
    return this.state.keys[key.fingerprint];
  }

  availableKeys() {
    return this.keys.filter((key) => {
      const entry = this.entry(key);
      return !entry.exhausted && entry.successes < this.dailyLimit;
    });
  }

  activeKey() {
    const available = this.availableKeys();
    if (!available.length) return undefined;
    this.currentIndex %= available.length;
    return available[this.currentIndex];
  }

  recordSuccess(key) {
    const entry = this.entry(key);
    entry.successes += 1;
    this.state.sessionGenerated += 1;
    if (entry.successes >= this.dailyLimit) {
      entry.exhausted = true;
      entry.exhaustedReason = "daily-limit";
      this.currentIndex += 1;
    }
    this.saveState();
  }

  markExhausted(key, reason) {
    const entry = this.entry(key);
    entry.exhausted = true;
    entry.exhaustedReason = reason;
    entry.failures += 1;
    this.currentIndex += 1;
    this.saveState();
  }

  /** Soft-rotate past a transient failure without burning the daily success quota. */
  rotateSoft(key) {
    const entry = this.entry(key);
    entry.failures += 1;
    this.currentIndex += 1;
    this.saveState();
  }

  allExhausted() {
    return this.availableKeys().length === 0;
  }

  summary() {
    return {
      datePacific: this.datePacific,
      dailyLimitPerKey: this.dailyLimit,
      keys: this.keys.map((key) => {
        const entry = this.entry(key);
        return {
          alias: key.alias,
          fingerprint: key.fingerprint,
          successes: entry.successes,
          remainingToday: Math.max(0, this.dailyLimit - entry.successes),
          exhausted: entry.exhausted,
          reason: entry.exhaustedReason,
        };
      }),
      sessionGenerated: this.state.sessionGenerated,
      keysAvailable: this.availableKeys().length,
    };
  }
}

async function requestAudio(prompt, key, attempt = 0) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": key, "content-type": "application/json" },
    signal: AbortSignal.timeout(90000),
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${STYLE_PROMPT}\nDo not fade out or cut the last word. Speak the full transcript through the final syllable, then hold a one-second silent pause.\n\nTRANSCRIPT (read verbatim):\n${prompt.scriptUrdu}` }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
      },
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    if ([408, 500, 502, 503, 504].includes(response.status) && attempt < 4) {
      const retrySeconds = Number(detail.match(/retry in ([0-9.]+)s/i)?.[1] || 0);
      const delay = Math.max(retrySeconds * 1000, Math.min(30000, 1000 * 2 ** attempt)) + Math.floor(Math.random() * 500);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return requestAudio(prompt, key, attempt + 1);
    }
    const error = new Error(`Gemini TTS ${response.status}: ${detail.slice(0, 500)}`);
    error.status = response.status;
    error.retryAfterMs = Math.max(30000, Number(detail.match(/retry in ([0-9.]+)s/i)?.[1] || 0) * 1000);
    throw error;
  }
  const result = await response.json();
  const data = result?.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData?.data;
  if (!data) {
    if (attempt < 4) {
      const delay = Math.min(30000, 1500 * 2 ** attempt) + Math.floor(Math.random() * 500);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return requestAudio(prompt, key, attempt + 1);
    }
    const error = new Error(`Gemini TTS empty audio (finishReason=${result?.candidates?.[0]?.finishReason || "unknown"})`);
    error.status = 503;
    error.emptyAudio = true;
    throw error;
  }
  return Buffer.from(data, "base64");
}

function encodeMp3(pcm, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const temp = path.join(os.tmpdir(), `kapas-voice-${crypto.randomUUID()}.pcm`);
  fs.writeFileSync(temp, pcm);
  const filters = "silenceremove=start_periods=1:start_duration=0.08:start_threshold=-50dB,loudnorm=I=-18:TP=-2:LRA=7,apad=pad_dur=1.0";
  const result = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", temp, "-codec:a", "libmp3lame", "-b:a", "64k", "-ar", "24000", "-ac", "1", "-af", filters, outputPath], { encoding: "utf8" });
  fs.rmSync(temp, { force: true });
  if (result.status !== 0) throw new Error(`ffmpeg failed: ${result.stderr}`);
}

function inspectAudio(file, prompt) {
  const probe = spawnSync("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_name,sample_rate,channels,bit_rate:format=duration", "-of", "json", file], { encoding: "utf8" });
  if (probe.status !== 0) throw new Error(`ffprobe failed for ${path.basename(file)}: ${probe.stderr}`);
  const parsed = JSON.parse(probe.stdout);
  const stream = parsed.streams?.[0];
  const durationSeconds = Number(parsed.format?.duration || 0);
  if (stream?.codec_name !== "mp3" || Number(stream?.sample_rate) !== 24000 || Number(stream?.channels) !== 1) throw new Error(`Invalid audio format for ${path.basename(file)}`);
  if (durationSeconds < 0.5 || durationSeconds > 120) throw new Error(`Abnormal duration ${durationSeconds}s for ${path.basename(file)}`);
  if (prompt) {
    const wordCount = prompt.scriptUrdu.split(/\s+/).filter(Boolean).length;
    const minimumSpeechSeconds = Math.max(1, wordCount / 4.5);
    if (durationSeconds < minimumSpeechSeconds) throw new Error(`Likely truncated speech: ${wordCount} words in ${durationSeconds.toFixed(2)}s for ${prompt.id}`);
  }
  const loudness = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "loudnorm=I=-18:TP=-2:LRA=7:print_format=json", "-f", "null", "-"], { encoding: "utf8" });
  const match = loudness.stderr.match(/\{\s*"input_i"[\s\S]*?\}/g)?.at(-1);
  const levels = match ? JSON.parse(match) : {};
  const integratedLufs = Number(levels.input_i);
  const truePeakDb = Number(levels.input_tp);
  if (!Number.isFinite(integratedLufs) || integratedLufs < -21 || integratedLufs > -15) throw new Error(`Loudness ${integratedLufs} LUFS is outside tolerance for ${path.basename(file)}`);
  if (!Number.isFinite(truePeakDb) || truePeakDb > -0.5) throw new Error(`True peak ${truePeakDb} dB may clip in ${path.basename(file)}`);
  return { codec: stream.codec_name, sampleRateHertz: Number(stream.sample_rate), channels: Number(stream.channels), bitrate: Number(stream.bit_rate || 0), durationSeconds: Number(durationSeconds.toFixed(3)), integratedLufs, truePeakDb };
}

function validateCatalog(prompts) {
  const errors = [];
  if (prompts.length !== 122) errors.push(`Expected 122 prompts, found ${prompts.length}`);
  const counts = prompts.reduce((result, prompt) => ({ ...result, [prompt.scope]: (result[prompt.scope] || 0) + 1 }), {});
  if (counts.screen !== 8 || counts.workflow !== 62 || counts.rights !== 52) errors.push(`Unexpected scope counts: ${JSON.stringify(counts)}`);
  for (const prompt of prompts) {
    if (!/[\u0600-\u06ff]/.test(prompt.scriptUrdu)) errors.push(`${prompt.id} has no Urdu text`);
    if (prompt.scriptUrdu.includes("، اور میں سے انتخاب کریں")) errors.push(`${prompt.id} contains an ambiguous generic other option`);
    if (prompt.scriptUrdu.length > 4000) errors.push(`${prompt.id} is too long`);
  }
  if (errors.length) throw new Error(errors.join("\n"));
  return counts;
}

function summarize(prompts) {
  const counts = { approved: 0, generated: 0, provisional: 0, stale: 0, missing: 0 };
  for (const prompt of prompts) counts[stateFor(prompt).status] += 1;
  return counts;
}

function approve(prompts, options, validationOnly) {
  if (!options.reviewer?.trim()) throw new Error("--reviewer is required for an auditable approval");
  const selected = validationOnly ? prompts.filter((prompt) => VALIDATION_IDS.includes(prompt.id)) : prompts;
  const missing = selected.filter((prompt) => !["generated", "approved"].includes(stateFor(prompt).status));
  if (missing.length) throw new Error(`Cannot approve; ${missing.length} selected clips are not freshly generated: ${missing.map((prompt) => prompt.id).join(", ")}`);
  const reviewedAt = new Date().toISOString();
  for (const prompt of selected) {
    const provenance = readProvenance(prompt);
    writeJsonAtomic(provenancePath(prompt), { ...provenance, approvalStatus: "approved", reviewer: options.reviewer.trim(), reviewedAt });
  }
  if (validationOnly) {
    const review = currentReview();
    writeJsonAtomic(REVIEW_PATH, { ...review, model: MODEL, voice: VOICE, validationPromptIds: VALIDATION_IDS, voiceValidation: { status: "approved", reviewer: options.reviewer.trim(), reviewedAt } });
  }
  writeGeneratedFiles(prompts);
  console.log(`Approved ${selected.length} clip(s) after review by ${options.reviewer.trim()}.`);
}

function pendingPrompts(prompts, options) {
  const scope = options.scope === "screens" ? "screen" : options.scope;
  let selected = prompts.filter((prompt) => !scope || prompt.scope === scope);
  if (options.validation) selected = selected.filter((prompt) => VALIDATION_IDS.includes(prompt.id));
  return selected.filter((prompt) => options.force || !["generated", "approved"].includes(stateFor(prompt).status));
}

function printProgress(prompts, sessionGenerated, pool) {
  const counts = summarize(prompts);
  const remaining = counts.missing + counts.stale + counts.provisional;
  console.log("\n--- Voice generation progress ---");
  console.log(`Session generated: ${sessionGenerated}`);
  console.log(`Catalog: ${counts.generated} generated, ${counts.provisional} provisional, ${counts.stale} stale, ${counts.missing} missing (${remaining} need work)`);
  if (pool) {
    const rotation = pool.summary();
    console.log(`Keys available today: ${rotation.keysAvailable}/${pool.keys.length} (${rotation.datePacific} Pacific)`);
    for (const key of rotation.keys) {
      const status = key.exhausted ? `exhausted (${key.reason})` : `${key.successes}/${pool.dailyLimit} used`;
      console.log(`  ${key.alias}: ${status}, ${key.remainingToday} left`);
    }
  }
  console.log("--------------------------------\n");
}

async function generateOne(prompt, key, projectAlias, prompts) {
  const previous = readProvenance(prompt);
  const pcm = await requestAudio(prompt, key.value);
  const stagedPath = path.join(STAGING_DIR, prompt.file);
  encodeMp3(pcm, stagedPath);
  const audio = inspectAudio(stagedPath, prompt);
  const fileBuffer = fs.readFileSync(stagedPath);
  const outputPath = path.join(AUDIO_DIR, prompt.file);
  fs.renameSync(stagedPath, outputPath);
  writeJsonAtomic(provenancePath(prompt), {
    promptId: prompt.id,
    locale: "ur-PK",
    model: MODEL,
    voice: VOICE,
    scriptUrdu: prompt.scriptUrdu,
    ...expectedHashes(prompt),
    fileSha256: sha256(fileBuffer),
    generatedAt: new Date().toISOString(),
    attempt: Number(previous?.attempt || 0) + 1,
    projectAlias,
    approvalStatus: "pending-native-review",
    reviewer: null,
    reviewedAt: null,
    audio,
  });
  writeGeneratedFiles(prompts);
  return audio;
}

async function generate(prompts, options) {
  const review = currentReview();
  if (!options.validation && !options.rotate && review.voiceValidation?.status !== "approved") {
    throw new Error("Sulafat validation is pending. Run voice:generate -- --validation, review the five clips, then run voice:approve-validation -- --reviewer \"Name\".");
  }
  if (options.rotate && !options.validation && review.voiceValidation?.status !== "approved") {
    console.warn("Rotation batch mode: proceeding without Sulafat validation approval. Review generated clips before release.");
  }

  let selected = pendingPrompts(prompts, options);
  if (options.limit !== Infinity) selected = selected.slice(0, options.limit);
  if (!selected.length) {
    console.log("No matching stale or missing prompts to generate.");
    printProgress(prompts, 0);
    return;
  }

  const pool = options.rotate ? new KeyPool(loadApiKeys()) : undefined;
  let key;
  if (pool) {
    key = pool.activeKey();
  } else {
    const value = apiKey();
    key = { alias: "GEMINI_TTS_API_KEY", value, fingerprint: sha256(value).slice(0, 12) };
  }
  if (!key?.value) {
    throw new Error(options.rotate ? "No API keys found. Set GEMINI_API_KEY_1..N or GEMINI_TTS_API_KEY in .env." : "GEMINI_TTS_API_KEY is required.");
  }
  if (pool?.allExhausted()) {
    console.error("All API keys exhausted for today. Retry after midnight Pacific.");
    printProgress(prompts, 0, pool);
    process.exitCode = 75;
    return;
  }

  fs.mkdirSync(STAGING_DIR, { recursive: true });
  fs.mkdirSync(PROVENANCE_DIR, { recursive: true });
  const projectAlias = process.env.GEMINI_TTS_PROJECT_ALIAS || "primary-free-project";
  let generated = 0;
  let promptIndex = 0;
  const emptyAudioAttempts = new Map();

  console.log(`Queued ${selected.length} clip(s). ${pool ? `Rotating ${pool.keys.length} key(s), ${KEY_DAILY_LIMIT}/key/day, ${REQUEST_INTERVAL_MS}ms interval.` : "Single-key mode."}`);

  while (promptIndex < selected.length) {
    const prompt = selected[promptIndex];
    const activeKey = pool ? pool.activeKey() : key;
    if (!activeKey) {
      console.error("All API keys exhausted for today. Stopping with checkpointed progress.");
      break;
    }

    try {
      const audio = await generateOne(prompt, activeKey, projectAlias, prompts);
      generated += 1;
      emptyAudioAttempts.delete(prompt.id);
      if (pool) pool.recordSuccess(activeKey);
      console.log(`[${generated}] ${prompt.id} ${audio.durationSeconds}s via ${activeKey.alias}`);
      promptIndex += 1;
      const hasMore = promptIndex < selected.length;
      const canContinue = pool ? !pool.allExhausted() : true;
      if (hasMore && canContinue) await new Promise((resolve) => setTimeout(resolve, REQUEST_INTERVAL_MS));
      else if (hasMore && pool?.allExhausted()) break;
    } catch (error) {
      writeGeneratedFiles(prompts);
      if (error?.status === 429 || error?.status === 403 || (error?.status === 400 && /API key not valid|API_KEY_INVALID/i.test(String(error.message)))) {
        if (pool) {
          const reason = error.status === 429 ? "quota-429" : error.status === 403 ? "denied-403" : "invalid-400";
          pool.markExhausted(activeKey, reason);
          console.warn(`${activeKey.alias} unavailable (${error.status}). Rotating to next key…`);
          if (pool.allExhausted()) break;
          if (error.retryAfterMs) await new Promise((resolve) => setTimeout(resolve, Math.min(error.retryAfterMs, 60000)));
          continue;
        }
        console.error("Daily or per-minute quota reached. Progress is checkpointed; retry after midnight Pacific.");
        process.exitCode = 75;
        break;
      }
      if (error?.emptyAudio || /empty audio|did not contain inline audio/i.test(String(error.message))) {
        const attempts = (emptyAudioAttempts.get(prompt.id) || 0) + 1;
        emptyAudioAttempts.set(prompt.id, attempts);
        const maxAttempts = pool ? Math.max(3, pool.keys.length * 2) : 3;
        console.warn(`${prompt.id}: empty TTS response via ${activeKey.alias} (attempt ${attempts}/${maxAttempts}).`);
        if (pool) {
          pool.rotateSoft(activeKey);
          if (attempts >= maxAttempts) {
            console.warn(`${prompt.id}: skipping after repeated empty responses; will retry in a later run.`);
            promptIndex += 1;
          }
          if (pool.allExhausted()) break;
          await new Promise((resolve) => setTimeout(resolve, REQUEST_INTERVAL_MS));
          continue;
        }
        if (attempts >= maxAttempts) {
          console.warn(`${prompt.id}: skipping after repeated empty responses.`);
          promptIndex += 1;
          continue;
        }
        await new Promise((resolve) => setTimeout(resolve, REQUEST_INTERVAL_MS));
        continue;
      }
      throw error;
    }
  }

  printProgress(prompts, generated, pool);
  if (pool?.allExhausted() && promptIndex < selected.length) {
    console.log(`Stopped early: all keys exhausted. ${selected.length - promptIndex} clip(s) still queued for tomorrow.`);
    process.exitCode = 75;
  } else {
    console.log(`Generated ${generated} clip(s) this run; native audio approval remains required before bundling.`);
  }
}

function verify(prompts) {
  const errors = [];
  for (const prompt of prompts) {
    const state = stateFor(prompt);
    if (state.status !== "approved") errors.push(`${prompt.id}: ${state.status}`);
    if (["approved", "generated"].includes(state.status)) {
      try { inspectAudio(path.join(AUDIO_DIR, prompt.file), prompt); } catch (error) { errors.push(`${prompt.id}: ${error.message}`); }
    }
  }
  if (errors.length) throw new Error(`Voice release verification failed (${errors.length} issue(s)):\n${errors.slice(0, 30).join("\n")}${errors.length > 30 ? "\n..." : ""}`);
  console.log(`Verified ${prompts.length} approved ${MODEL}/${VOICE} offline assets.`);
}

function remasterExisting(prompts) {
  let updated = 0;
  for (const prompt of prompts) {
    const outputPath = path.join(AUDIO_DIR, prompt.file);
    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size <= 1024) continue;
    const tempPath = `${outputPath}.${process.pid}.tmp.mp3`;
    const filters = "loudnorm=I=-18:TP=-2:LRA=7,apad=pad_dur=1.0";
    const result = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", outputPath, "-codec:a", "libmp3lame", "-b:a", "64k", "-ar", "24000", "-ac", "1", "-af", filters, tempPath], { encoding: "utf8" });
    if (result.status !== 0) throw new Error(`ffmpeg remaster failed for ${prompt.file}: ${result.stderr}`);
    inspectAudio(tempPath);
    fs.renameSync(tempPath, outputPath);
    const provenance = readProvenance(prompt);
    if (provenance) {
      writeJsonAtomic(provenancePath(prompt), {
        ...provenance,
        masteringSha256: sha256(MASTERING_PROFILE),
        fileSha256: sha256(fs.readFileSync(outputPath)),
        remasteredAt: new Date().toISOString(),
        remasterProfile: MASTERING_PROFILE,
      });
    }
    updated += 1;
  }
  console.log(`Remastered ${updated} clip(s) with ${MASTERING_PROFILE}.`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const prompts = buildCatalog();
  const scopeCounts = validateCatalog(prompts);
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  if (options.command === "validate") {
    console.log(`Valid catalog: ${prompts.length} prompts ${JSON.stringify(scopeCounts)} (${MODEL}, ${VOICE}).`);
    return;
  }
  if (options.command === "status") {
    console.log(JSON.stringify({ model: MODEL, voice: VOICE, total: prompts.length, ...summarize(prompts), voiceValidation: currentReview().voiceValidation }, null, 2));
    return;
  }
  if (options.command === "credentials") {
    const keys = loadApiKeys();
    console.log(JSON.stringify({ configured: keys.length, aliases: keys.map((key) => key.alias) }, null, 2));
    return;
  }
  if (options.command === "sync") {
    writeGeneratedFiles(prompts);
    const bundled = prompts.filter((prompt) => {
      const outputPath = path.join(AUDIO_DIR, prompt.file);
      return fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1024;
    }).length;
    console.log(`Synced voice assets: ${bundled}/${prompts.length} prompts bundled for Metro.`);
    return;
  }
  if (options.command === "remaster") {
    remasterExisting(prompts);
    writeGeneratedFiles(prompts);
    return;
  }
  if (options.command === "generate") await generate(prompts, options);
  else if (options.command === "approve-validation") approve(prompts, options, true);
  else if (options.command === "approve-audio") approve(prompts, options, false);
  else if (options.command === "verify") verify(prompts);
  if (["generate", "approve-validation", "approve-audio", "remaster"].includes(options.command)) writeGeneratedFiles(prompts);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
