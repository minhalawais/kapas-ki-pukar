export const fontFamily = {
  ui: 'Inter, ui-sans-serif, system-ui, sans-serif',
  urduHeading: '"Noto Nastaliq Urdu", "Noto Naskh Arabic", serif',
  urduUi: '"Noto Naskh Arabic", "Noto Nastaliq Urdu", sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
} as const;

/** Mobile (low-literacy). Sizes in px. */
export const mobileType = {
  display: { size: 28, line: 36, weight: 700 },
  h1: { size: 24, line: 32, weight: 700 },
  question: { size: 26, line: 34, weight: 700 },
  answer: { size: 20, line: 28, weight: 600 },
  body: { size: 17, line: 24, weight: 400 },
  helper: { size: 16, line: 22, weight: 400 },
  button: { size: 18, line: 24, weight: 600 },
  caption: { size: 14, line: 18, weight: 500 },
  reference: { size: 18, line: 24, weight: 600 },
} as const;

/** Portal (FOS compact density). */
export const webType = {
  display: { size: 24, line: 32, weight: 650 },
  h1: { size: 22, line: 28, weight: 650 },
  h2: { size: 18, line: 24, weight: 650 },
  h3: { size: 16, line: 22, weight: 600 },
  body: { size: 14, line: 20, weight: 400 },
  table: { size: 13, line: 18, weight: 400 },
  helper: { size: 12, line: 16, weight: 500 },
  button: { size: 14, line: 20, weight: 600 },
  caption: { size: 11, line: 14, weight: 550 },
  kpi: { size: 28, line: 34, weight: 650 },
} as const;
