import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PORTAL_AUDIO_DIR = path.join(ROOT, "apps/puwf-portal/public/demo-audio");

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return {};
  const result = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*))\s*$/);
    if (match) {
      result[match[1]] = match[2] ?? match[3] ?? match[4] ?? "";
    }
  }
  return result;
}

const env = { ...loadEnv(), ...process.env };
const key = env.GOOGLE_API_KEY || env.GEMINI_API_KEY_1 || env.GEMINI_TTS_API_KEY;

if (!key) {
  console.error("No Gemini API key found in .env");
  process.exit(1);
}

const MODEL = "gemini-2.5-flash-preview-tts";
const VOICE = "Sulafat"; // Warm worker voice

const scriptUrdu = "السلام علیکم۔ میں کھیت میں کام کرتی ہوں۔ اسپرے کے فوراً بعد ہمیں کھیت میں کام کے لیے بھیج دیا گیا اور کیمیائی بو کی وجہ سے ہماری طبیعت خراب ہوئی۔ ہم چاہتے ہیں کہ کام کی جگہ پر ہماری صحت اور حفاظت کا خیال رکھا جائے۔";

const stylePrompt = [
  "Speak only the supplied Urdu transcript, exactly as written, without adding an introduction or commentary.",
  "Use natural, professional Pakistani Urdu in a warm, mature worker-support voice.",
  "The listener may have low literacy and may be outdoors, so articulate clearly at a calm, moderately slow pace.",
  "Sound respectful and reassuring, never theatrical, cheerful, judgmental, bureaucratic, or patronizing.",
  "Use short natural pauses at Urdu sentence endings.",
].join(" ");

async function generateWorkerAudio() {
  console.log("Generating worker voice audio using Gemini TTS (" + VOICE + ")...");
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [{ text: `${stylePrompt}\nDo not fade out or cut the last word. Speak the full transcript through the final syllable, then hold a one-second silent pause.\n\nTRANSCRIPT (read verbatim):\n${scriptUrdu}` }]
      }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini TTS failed (${response.status}): ${detail}`);
  }

  const result = await response.json();
  const base64Pcm = result?.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData?.data;

  if (!base64Pcm) {
    throw new Error("No inline audio data returned from Gemini TTS");
  }

  const pcmBuffer = Buffer.from(base64Pcm, "base64");
  fs.mkdirSync(PORTAL_AUDIO_DIR, { recursive: true });

  const tempPcm = path.join(os.tmpdir(), `worker-voice-${crypto.randomUUID()}.pcm`);
  fs.writeFileSync(tempPcm, pcmBuffer);

  const mp3Path = path.join(PORTAL_AUDIO_DIR, "worker-statement.mp3");
  const wavPath = path.join(PORTAL_AUDIO_DIR, "placeholder.wav");

  const filters = "silenceremove=start_periods=1:start_duration=0.08:start_threshold=-50dB,loudnorm=I=-18:TP=-2:LRA=7,apad=pad_dur=1.0";
  
  // Encode MP3
  const ffmpegMp3 = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", tempPcm,
    "-codec:a", "libmp3lame", "-b:a", "64k", "-ar", "24000", "-ac", "1",
    "-af", filters,
    mp3Path
  ], { encoding: "utf8" });

  if (ffmpegMp3.status !== 0) {
    console.error("ffmpeg MP3 failed:", ffmpegMp3.stderr);
  } else {
    console.log("Successfully generated MP3 at:", mp3Path);
  }

  // Also copy/encode WAV for placeholder compatibility
  const ffmpegWav = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", tempPcm,
    "-af", filters,
    wavPath
  ], { encoding: "utf8" });

  if (ffmpegWav.status !== 0) {
    console.error("ffmpeg WAV failed:", ffmpegWav.stderr);
  } else {
    console.log("Successfully generated WAV at:", wavPath);
  }

  fs.unlinkSync(tempPcm);
}

generateWorkerAudio().catch((err) => {
  console.error("Error generating audio:", err);
  process.exit(1);
});
