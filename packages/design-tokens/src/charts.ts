/** Mixed categorical palette. Max two green-family series per chart. */
export const chartColors = {
  series1: "#2D9480",
  series2: "#E5A62E",
  series3: "#2877B8",
  series4: "#0B4F37",
  series5: "#E48424",
  series6: "#7B8A84",
  grid: "#DCE5E0",
  axis: "#66736D",
} as const;

export const chartSeriesOrder = [
  chartColors.series1,
  chartColors.series2,
  chartColors.series3,
  chartColors.series4,
  chartColors.series5,
  chartColors.series6,
] as const;
