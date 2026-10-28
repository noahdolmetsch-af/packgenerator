/**
 * «Genaue Werte» + «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): every chart of the app follows the
 * same rules, checked by tests/charts-rules.test.js:
 *   1. a value axis with round, labelled steps, its unit and fine grid lines (axis.js, YTicks, GridLines);
 *      bars start at 0; two units never share one axis;
 *   2. the exact numbers with the day or week when pointing or tapping (Readout, pick.js);
 *   3. with few points (up to 12, bars up to 26) the number at each point or bar;
 *   4. a tap opens what is behind it (ChartSheet); 5. «Als Tabelle» shows the same numbers (DataTable);
 *   6. no data stays a gap, never a fall to 0; at least three dates under a time axis.
 * BarChart.svelte does all of it for bars. DONE: the charts that follow the rules. OPEN: the charts still
 * to change, one small PR per page (docs/releases/diagramme-tippen.md has the order). A new chart goes into
 * DONE; moving one from OPEN to DONE is how the work goes on.
 */
export const DONE = ['src/lib/flow/auswertung/TkWeeks.svelte', 'src/lib/flow/auswertung/TkSpread.svelte', 'src/lib/flow/auswertung/TkLine.svelte', 'src/lib/flow/form/FormVerlauf.svelte'];

export const OPEN = [
  // Form und Erholung, Körperwerte
  'src/pages/flow/Form.svelte',
  'src/pages/flow/Stats.svelte',
  // Haken und Antworten ausgewertet
  'src/lib/flow/auswertung/AnLine.svelte',
  'src/lib/flow/auswertung/AnDays.svelte',
  // Training: Woche und Fahrt
  'src/lib/training/week/AnaEff.svelte',
  'src/lib/training/week/AnaForm.svelte',
  'src/lib/training/week/AnaPCurve.svelte',
  'src/lib/training/week/AnaWLoad.svelte',
  'src/lib/training/act/LoadCurve.svelte',
  'src/lib/training/act/AnaCadence.svelte',
  'src/lib/training/act/AnaPzBars.svelte',
  'src/lib/training/act/AnaSimilar.svelte',
  'src/lib/training/inhalt/AnaDecouple.svelte',
  'src/lib/training/inhalt/AnaHomeloop.svelte',
  // Aktiv
  'src/lib/health/AzmWeek.svelte',
  'src/lib/flow/form/FormCard.svelte',
  'src/lib/flow/garmin/Overview.svelte',
  'src/lib/flow/garmin/Focus.svelte',
  'src/lib/flow/hobby/RingsWeek.svelte',
  'src/lib/sportpage/MeasureCard.svelte',
  'src/lib/weight/LineChart.svelte',
  'src/pages/flow/MedPatterns.svelte',
  'src/pages/flow/MedReview.svelte',
  'src/pages/flow/Rest.svelte',
  'src/pages/flow/TrainingWeek.svelte',
  'src/pages/Wohl.svelte',
  // Heute
  'src/lib/home/BalanceTile.svelte',
  'src/lib/home/RoutineTile.svelte',
  'src/lib/home/YearRow.svelte',
  // Rückblick
  'src/lib/review/HeartPower.svelte',
  'src/lib/review/MiniBars.svelte',
  'src/lib/review/InZahlen.svelte',
  'src/lib/debrief/PaceMonths.svelte',
  'src/lib/tagebuch/Rueckblick.svelte',
  // Unterwegs, Rennen, Ski
  'src/lib/live/DpChart.svelte',
  'src/lib/live/SensorCurve.svelte',
  'src/lib/map/WxTimeline.svelte',
  'src/lib/race/prep/Load.svelte',
  'src/pages/ski/SkiSeason.svelte',
];
