// «Zahlen, die sich nicht widersprechen» (Noah 08.11.2026 «1-5 a», UX-Test): dieselbe Zahl hat überall dieselbe Regel
export default {
  title: 'The same number everywhere',
  lead: 'Six places showed two different numbers for the same thing. Now each one is counted by one rule and says what it counts.',
  points: [
    { text: 'The week counts your trips, the backup line on Today and the trip card no longer contradict themselves', go: { href: '#/week', where: 'Planning › Week: the line under the title starts with the trips; on Today the backup line and «Trip 1 of 8» are clear.' } },
    { text: 'Trips, Look back, Logbook and Past trips count «waits for your review» the same way', go: { href: '#/debrief', where: 'Look back: the number beside «Completed» is the same as «n wait for your review» on Trips.' } },
    { text: 'Gear: «weighed» is the gear without food and drink, which is named beside it; Aktiv counts all goals of the week', go: { href: '#/gear', where: 'Gear (computer): under «weighed» stands «+ … food and drink, not in it». Aktiv: the head line counts all goals of the week.' } },
  ],
  small: [],
  test: [
    'Open Planning › Week in a week with a trip: the line under the title starts with «1 trip».',
    'Open Trips, then Look back: the number of trips that wait for a review is the same on both.',
    'Open Aktiv: the head line says «this week 1 of 13 goals on track» (all goals), the week card counts the open ones of the same 13.',
  ],
  since: [],
  de: {
    'The same number everywhere': 'Überall dieselbe Zahl',
    'Six places showed two different numbers for the same thing. Now each one is counted by one rule and says what it counts.': 'Sechs Stellen zeigten für dieselbe Sache zwei verschiedene Zahlen. Jetzt zählt jede nach einer Regel und sagt, was sie zählt.',
    'The week counts your trips, the backup line on Today and the trip card no longer contradict themselves': 'Die Woche zählt deine Touren, die Backup-Zeile auf Heute und die Tourkarte widersprechen sich nicht mehr',
    'Planning › Week: the line under the title starts with the trips; on Today the backup line and «Trip 1 of 8» are clear.': 'Planen › Woche: Die Zeile unter dem Titel beginnt mit den Touren; auf Heute sind die Backup-Zeile und «Tour 1 von 8» klar.',
    'Trips, Look back, Logbook and Past trips count «waits for your review» the same way': 'Touren, Rückblick, Logbuch und Vergangene Touren zählen «wartet auf Rückblick» gleich',
    'Look back: the number beside «Completed» is the same as «n wait for your review» on Trips.': 'Rückblick: Die Zahl bei «Abgeschlossen» ist dieselbe wie «n warten auf deinen Rückblick» auf Touren.',
    'Gear: «weighed» is the gear without food and drink, which is named beside it; Aktiv counts all goals of the week': 'Material: «gewogen» ist das Gerät ohne Essen und Trinken, das daneben steht; Aktiv zählt alle Ziele der Woche',
    'Gear (computer): under «weighed» stands «+ … food and drink, not in it». Aktiv: the head line counts all goals of the week.': 'Material (Computer): Unter «gewogen» steht «+ … Essen und Trinken, nicht dabei». Aktiv: Die Kopfzeile zählt alle Ziele der Woche.',
    'Open Planning › Week in a week with a trip: the line under the title starts with «1 trip».': 'Öffne Planen › Woche in einer Woche mit einer Tour: Die Zeile unter dem Titel beginnt mit «1 Tour».',
    'Open Trips, then Look back: the number of trips that wait for a review is the same on both.': 'Öffne Touren, dann Rückblick: Die Zahl der Touren, die auf einen Rückblick warten, ist auf beiden gleich.',
    'Open Aktiv: the head line says «this week 1 of 13 goals on track» (all goals), the week card counts the open ones of the same 13.': 'Öffne Aktiv: Die Kopfzeile sagt «diese Woche 1 von 13 Zielen im Soll» (alle Ziele), die Wochenkarte zählt die offenen derselben 13.',
  },
};
