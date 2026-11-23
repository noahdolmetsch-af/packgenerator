// «Form und Erholung klüger» (Noah 23.11.2026 «ja»): eine Antwort für heute, «Was auffällt» für alle Werte, «Was wäre, wenn» als Sätze
export default {
  title: 'Form and recovery, clearer',
  lead: 'The page now gives one answer for today from all your values, and no longer contradicts itself.',
  points: [
    { text: 'At the top: one answer for today from sleep, HRV, resting pulse and form together, with the values that count', go: { href: '#/flow/form', where: 'Shows at the very top of the page: the answer for today.', steps: [{ sel: '[data-form-now]' }] } },
    { text: '«What stands out» sits right under it and looks at resting pulse, HRV and sleep', go: { href: '#/flow/form', where: 'Shows right under the answer: «What stands out».', steps: [{ sel: '[data-auffaellt]' }] } },
    { text: '«What if» says it in plain sentences; minutes and the table of numbers are one tap away', go: { href: '#/flow/form', where: 'Shows further down under «What if …» once your activities from Strava are in.', steps: [{ sel: '[data-ww-more] summary' }] } },
  ],
  small: [
    { box: 'new', text: 'The tour readiness shows only when a tour is running or starts within 7 days, never for the made-up examples' },
    { box: 'new', text: '«Over time» starts with the form alone; fitness, fatigue and resting pulse are switched on with a tap', go: { href: '#/flow/form', where: 'Shows under «Over time» once your activities from Strava are in: tap «Fitness».', steps: [{ sel: '[data-form-curve] [data-layer="fit"]' }] } },
    { box: 'new', text: 'Years without rides stand in one closed line under «Form compared with earlier»; no value is lost' },
  ],
  test: [
    'Open Analysis › Body › Form and recovery: on top one answer for today. If sleep and HRV are low, it says so and names them, even when your form is good.',
    'Right under it «What stands out» names resting pulse, HRV or sleep when one is clearly off, or says that all three are in your normal.',
    'Further down «What if …» shows two or three sentences. Tap «Change it and see all numbers» for the minutes and the table.',
  ],
  since: [],
  de: {
    'Shows at the very top of the page: the answer for today.': 'Steht ganz oben auf der Seite: die Antwort für heute.',
    'Shows right under the answer: «What stands out».': 'Steht direkt unter der Antwort: «Was auffällt».',
    'Shows further down under «What if …» once your activities from Strava are in.': 'Steht weiter unten bei «Was wäre, wenn …», sobald deine Aktivitäten von Strava da sind.',
    'Shows under «Over time» once your activities from Strava are in: tap «Fitness».': 'Steht unter «Verlauf», sobald deine Aktivitäten von Strava da sind: Tippe auf «Fitness».',
    'Form and recovery, clearer': 'Form und Erholung, klarer',
    'The page now gives one answer for today from all your values, and no longer contradicts itself.': 'Die Seite gibt jetzt eine Antwort für heute aus allen deinen Werten und widerspricht sich nicht mehr.',
    'At the top: one answer for today from sleep, HRV, resting pulse and form together, with the values that count': 'Oben: eine Antwort für heute aus Schlaf, HRV, Ruhepuls und Form zusammen, mit den Werten, die zählen',
    '«What stands out» sits right under it and looks at resting pulse, HRV and sleep': '«Was auffällt» steht direkt darunter und schaut auf Ruhepuls, HRV und Schlaf',
    '«What if» says it in plain sentences; minutes and the table of numbers are one tap away': '«Was wäre, wenn» sagt es in einfachen Sätzen; Minuten und die Zahlentabelle sind einen Tipp entfernt',
    'The tour readiness shows only when a tour is running or starts within 7 days, never for the made-up examples': 'Die Tour-Bereitschaft zeigt sich nur, wenn eine Tour läuft oder in 7 Tagen beginnt, nie für die erfundenen Beispiele',
    '«Over time» starts with the form alone; fitness, fatigue and resting pulse are switched on with a tap': '«Verlauf» beginnt nur mit der Form; Fitness, Müdigkeit und Ruhepuls schaltest du mit einem Tipp zu',
    'Years without rides stand in one closed line under «Form compared with earlier»; no value is lost': 'Jahre ohne Fahrten stehen in einer geschlossenen Zeile unter «Form im Vergleich zu früher»; kein Wert geht verloren',
    'Open Analysis › Body › Form and recovery: on top one answer for today. If sleep and HRV are low, it says so and names them, even when your form is good.': 'Öffne Auswerten › Körper › Form und Erholung: Oben steht eine Antwort für heute. Sind Schlaf und HRV tief, sagt sie das und nennt sie, auch wenn deine Form gut ist.',
    'Right under it «What stands out» names resting pulse, HRV or sleep when one is clearly off, or says that all three are in your normal.': 'Direkt darunter nennt «Was auffällt» Ruhepuls, HRV oder Schlaf, wenn einer deutlich abweicht, oder sagt, dass alle drei in deinem Normal liegen.',
    'Further down «What if …» shows two or three sentences. Tap «Change it and see all numbers» for the minutes and the table.': 'Weiter unten zeigt «Was wäre, wenn …» zwei oder drei Sätze. Tippe «Anpassen und alle Zahlen sehen» für die Minuten und die Tabelle.',
  },
};
