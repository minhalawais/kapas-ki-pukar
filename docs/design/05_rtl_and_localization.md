# 05 — RTL and localization

## Locale files

```text
packages/localization/src/locales/ur.json
packages/localization/src/locales/en.json
packages/localization/src/locales/sd.json   # placeholder only
packages/localization/src/locales/skr.json  # placeholder only
```

Developers do not invent Urdu. Use the translation sheet (`07_developer_handoff.md`).

## Direction

| Locale | Dir |
|---|---|
| ur | rtl |
| en | ltr |

Helpers: `isRTL(locale)`, row reverse, icon mirror allow-list.

## Mirror

Mirror: back/forward chevrons, progress fill direction, start/end padding.

Do not mirror: microphone, camera, lock, location pin, play, warning, Kapas mark.

## LTR isolation

Always isolate: complaint IDs (`KP-26-######`), phone numbers, Latin acronyms PUWF/FOS/ILO, audio timestamps.

## Layout

- Text align follows locale.
- Long Urdu: grow height, do not shrink below `mobileType` minimums.
- Mixed Urdu/English lines: test bidi.
- Portal tables remain LTR while portal UI is English.

## Progress in RTL

Step 1 is visually at the start edge (right in Urdu). Back moves toward later? Standard RTL: back is toward the end of the reading... For wizards, Back control sits at the start edge, Continue at the end edge in the current locale.
