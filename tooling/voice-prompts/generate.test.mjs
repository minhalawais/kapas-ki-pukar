/* global process */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const GENERATOR = path.join(ROOT, "tooling/voice-prompts/generate.mjs");

function run(...args) {
  return execFileSync(process.execPath, [GENERATOR, ...args], { cwd: ROOT, encoding: "utf8" });
}

test("catalog is pinned to the expected model, voice, and prompt counts", () => {
  assert.match(run("validate"), /122 prompts/);
  const status = JSON.parse(run("status"));
  assert.equal(status.model, "gemini-2.5-flash-preview-tts");
  assert.equal(status.voice, "Sulafat");
  assert.equal(status.total, 122);
  assert.equal(status.approved + status.generated + status.provisional + status.stale + status.missing, 122);
});

test("generation requires an API key", () => {
  const env = { ...process.env, VOICE_IGNORE_DOTENV: "1" };
  delete env.GEMINI_TTS_API_KEY;
  for (let index = 1; index <= 20; index += 1) delete env[`GEMINI_API_KEY_${index}`];
  delete env.GOOGLE_API_KEY;
  const result = spawnSync(process.execPath, [GENERATOR, "generate", "--validation", "--force", "--limit", "1"], { cwd: ROOT, env, encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /GEMINI_TTS_API_KEY is required|No API keys found/);
});

test("credential inspection loads numbered keys from env", () => {
  const env = {
    ...process.env,
    VOICE_IGNORE_DOTENV: "1",
    GEMINI_API_KEY_1: "test-key-alpha",
    GEMINI_API_KEY_2: "test-key-beta",
    VOICE_KEY_DAILY_LIMIT: "10",
  };
  delete env.GEMINI_TTS_API_KEY;
  delete env.GOOGLE_API_KEY;
  const result = spawnSync(process.execPath, [GENERATOR, "credentials"], { cwd: ROOT, env, encoding: "utf8" });
  assert.equal(result.status, 0);
  const credentials = JSON.parse(result.stdout);
  assert.equal(credentials.configured, 2);
  assert.deepEqual(credentials.aliases, ["GEMINI_API_KEY_1", "GEMINI_API_KEY_2"]);
});

test("full generation is gated by native validation approval", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "kapas-voice-test-"));
  const reviewPath = path.join(tempDir, "review.json");
  fs.writeFileSync(reviewPath, JSON.stringify({ voiceValidation: { status: "pending" } }));
  try {
    const result = spawnSync(process.execPath, [GENERATOR, "generate", "--force", "--limit", "1"], {
      cwd: ROOT,
      env: { ...process.env, VOICE_REVIEW_PATH: reviewPath },
      encoding: "utf8",
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Sulafat validation is pending/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
