# Urdu voice catalog

The mobile app bundles its Urdu guidance and does not call Gemini at runtime. The catalog is pinned to `gemini-2.5-flash-preview-tts` with the warm `Sulafat` voice. Generation accepts exactly one designated credential through `GEMINI_TTS_API_KEY`; numbered keys and generic Google keys are intentionally ignored.

Free-tier prompts must contain only approved static guidance. Never submit complaint recordings, CNICs, locations, contact details, or other user data.

## Workflow

```bash
# Static checks and current progress
npx pnpm@9.15.0 voice:validate
npx pnpm@9.15.0 voice:status

# Generate the five native-review samples
GEMINI_TTS_API_KEY=... npx pnpm@9.15.0 voice:generate -- --validation --limit 5

# After a Pakistani Urdu reviewer listens to every sample
npx pnpm@9.15.0 voice:approve-validation -- --reviewer "Reviewer name"

# Generate gradually within the active project's AI Studio limit
GEMINI_TTS_API_KEY=... npx pnpm@9.15.0 voice:generate

# Rotate through GEMINI_API_KEY_1..N until each key's daily quota is used (10/day default)
VOICE_KEY_DAILY_LIMIT=10 VOICE_REQUEST_INTERVAL_MS=21000 \
  npx pnpm@9.15.0 voice:generate -- --rotate

# A scope can be selected without changing catalog order
GEMINI_TTS_API_KEY=... npx pnpm@9.15.0 voice:generate -- --scope workflow --limit 10

# After native review of the complete audio catalog
npx pnpm@9.15.0 voice:approve-audio -- --reviewer "Reviewer name"
npx pnpm@9.15.0 voice:verify
```

On quota exhaustion the command checkpoints completed clips, exits with status `75`, and does not try another key. Resume after the quota reset shown in AI Studio. Requests-per-day reset at midnight Pacific.

## Release gate

`voice:verify` requires all 109 files to be approved, current, mono 24 kHz MP3, within duration/loudness/peak tolerances, and generated with the pinned model, voice, script and direction hashes. `voice:sync` atomically rebuilds the catalog and Metro registries; only approved files are bundled.

Per-file provenance is stored under `apps/mobile/assets/audio/ur/.provenance`. API key values and account identifiers are never written there.
