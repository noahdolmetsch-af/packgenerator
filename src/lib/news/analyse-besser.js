// «Analyse besser» (Noah 23.11.2026 «ja», Thread «Analyse-Seite viel besser machen»): Was auffällt, Vergleich, 12 Wochen, laufende Woche, Gruppen, ruhigeres Eigenes Diagramm
export default {
  title: 'Analyse made clearer',
  lead: 'Analyse now says what stands out, compares with before and keeps the own diagram calm.',
  points: [
    { text: 'On the overview, up to three sentences say what stands out, and every box says how it stands against the days before', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-overview]' }], where: 'Auswerten › Analyse › Overview, at the top.' } },
    { text: '«Every day a field» fills the whole width with 12 weeks; the running week is dashed and left out of the mean', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-heat]' }], where: 'Auswerten › Analyse › Overview; the field shows once there are days with data.' } },
    { text: 'In the own diagram the choices stand above the chart, the trips are one calm band and point at a day shows all values', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-tab="diagramm"]' }, { sel: '[data-dg-change]' }] } },
  ],
  small: [
    { box: 'new', text: 'The ranking stands in groups (Move, Mindful, Recovery); two entries with the same name count as one line' },
    { box: 'new', text: '«What goes together?» leaves out obvious pairs such as pulse zones and time in motion, and says «No link»' },
  ],
  test: [
    'Open Auswerten › Analyse › Overview: at the top «What stands out» with up to three sentences; under it the boxes with «… against the 30 days before».',
    'Scroll to «Every day a field»: the fields fill the card, the course shows the running week dashed with «running».',
    'Open «Own diagram»: the choices (What, How long, Filter) stand above the chart; move the mouse over the chart, the line above it shows every value of that day.',
  ],
  since: [],
  de: {
    'Auswerten › Analyse › Overview; the field shows once there are days with data.': 'Auswerten › Analyse › Übersicht; das Feld erscheint, sobald es Tage mit Daten gibt.',
    'Analyse made clearer': 'Analyse übersichtlicher',
    'Analyse now says what stands out, compares with before and keeps the own diagram calm.': 'Analyse sagt jetzt, was auffällt, vergleicht mit davor und hält das eigene Diagramm ruhig.',
    'On the overview, up to three sentences say what stands out, and every box says how it stands against the days before': 'Auf der Übersicht sagen bis zu drei Sätze, was auffällt, und jede Kachel sagt, wie sie gegen die Tage davor steht',
    'Auswerten › Analyse › Overview, at the top.': 'Auswerten › Analyse › Übersicht, ganz oben.',
    '«Every day a field» fills the whole width with 12 weeks; the running week is dashed and left out of the mean': '«Jeder Tag ein Feld» füllt die ganze Breite mit 12 Wochen; die laufende Woche ist gestrichelt und zählt nicht im Schnitt',
    'In the own diagram the choices stand above the chart, the trips are one calm band and point at a day shows all values': 'Im eigenen Diagramm stehen die Auswahlen über dem Diagramm, die Touren sind ein ruhiges Band, und das Zeigen auf einen Tag zeigt alle Werte',
    'The ranking stands in groups (Move, Mindful, Recovery); two entries with the same name count as one line': 'Die Rangliste steht in Gruppen (Bewegen, Achtsam, Erholung); zwei Einträge mit gleichem Namen zählen als eine Zeile',
    '«What goes together?» leaves out obvious pairs such as pulse zones and time in motion, and says «No link»': '«Was hängt zusammen?» lässt selbstverständliche Paare wie Pulszonen und Zeit in Bewegung weg und sagt «Kein Zusammenhang»',
    'Open Auswerten › Analyse › Overview: at the top «What stands out» with up to three sentences; under it the boxes with «… against the 30 days before».': 'Öffne Auswerten › Analyse › Übersicht: oben «Was auffällt» mit bis zu drei Sätzen; darunter die Kacheln mit «… gegen die 30 Tage davor».',
    'Scroll to «Every day a field»: the fields fill the card, the course shows the running week dashed with «running».': 'Scrolle zu «Jeder Tag ein Feld»: die Felder füllen die Karte, der Verlauf zeigt die laufende Woche gestrichelt mit «läuft».',
    'Open «Own diagram»: the choices (What, How long, Filter) stand above the chart; move the mouse over the chart, the line above it shows every value of that day.': 'Öffne «Eigenes Diagramm»: die Auswahlen (Was, Wie lange, Filter und Ansicht) stehen über dem Diagramm; fahre mit der Maus über das Diagramm, die Zeile darüber zeigt alle Werte dieses Tages.',
  },
};
