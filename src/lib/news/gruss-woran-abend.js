// Gruss «Wi gahts?» D (Noah 05.11.2026 «alle umsetzen», Thread «Planen: Tagescheck mit Fragen»): «Woran liegt's?» und der Abend
export default {
  title: 'Why, and how the day was',
  lead: 'The greeting can ask what plays a part, and in the evening it asks how the day was instead of the plan.',
  points: [
    { text: 'Greeting › «Woran liegt\'s?»: sleep, weather, work, people, body (optional, your own words possible), only counted, never a verdict', go: { href: '#/', steps: [{ sel: '[data-hello-tap]' }, { sel: '[data-hello-why]' }], where: 'Today › the greeting at the top › «Woran liegt\'s?».' } },
    { text: 'From 18:00 the greeting asks «Wie war\'s?» with words for the day instead of «Was häsch vor?»', go: { href: '#/', steps: [{ sel: '[data-hello-tap]' }], where: 'Today › the greeting at the top, in the evening.' } },
  ],
  small: [
    { box: 'new', text: 'Both lists sit under «Adjust buttons» and can be renamed, hidden, deleted and sorted' },
    { box: 'nicer', text: 'Under «Woran liegt\'s?» a quiet line counts what you named in the last 30 days' },
  ],
  test: [
    'Open Today, tap the greeting and then «Woran liegt\'s?»: choose one or two things.',
    'Open «Adjust buttons» and rename or hide one of them, then go «Back».',
    'In the evening (from 18:00) tap the greeting: it asks «Wie war\'s?» with words like «Gschafft» or «Streng».',
  ],
  since: [],
  de: {
    'Why, and how the day was': 'Woran es liegt, und wie der Tag war',
    'The greeting can ask what plays a part, and in the evening it asks how the day was instead of the plan.': 'Der Gruss kann fragen, was eine Rolle spielt, und fragt am Abend, wie der Tag war, statt nach dem Plan.',
    'Greeting › «Woran liegt\'s?»: sleep, weather, work, people, body (optional, your own words possible), only counted, never a verdict': 'Gruss › «Woran liegt\'s?»: Schlaf, Wetter, Arbeit, Menschen, Körper (freiwillig, eigene Wörter möglich), nur gezählt, nie ein Urteil',
    'Today › the greeting at the top › «Woran liegt\'s?».': 'Heute › der Gruss oben › «Woran liegt\'s?».',
    'From 18:00 the greeting asks «Wie war\'s?» with words for the day instead of «Was häsch vor?»': 'Ab 18 Uhr fragt der Gruss «Wie war\'s?» mit Wörtern für den Tag statt «Was häsch vor?»',
    'Today › the greeting at the top, in the evening.': 'Heute › der Gruss oben, am Abend.',
    'Both lists sit under «Adjust buttons» and can be renamed, hidden, deleted and sorted': 'Beide Listen stehen unter «Knöpfe anpassen» und lassen sich umbenennen, ausblenden, löschen und ordnen',
    'Under «Woran liegt\'s?» a quiet line counts what you named in the last 30 days': 'Unter «Woran liegt\'s?» zählt eine ruhige Zeile, was du in den letzten 30 Tagen genannt hast',
    'Open Today, tap the greeting and then «Woran liegt\'s?»: choose one or two things.': 'Öffne Heute, tippe auf den Gruss und dann auf «Woran liegt\'s?»: wähle ein, zwei Dinge.',
    'Open «Adjust buttons» and rename or hide one of them, then go «Back».': 'Öffne «Knöpfe anpassen», benenne eines davon um oder blende es aus und gehe dann «Zurück».',
    'In the evening (from 18:00) tap the greeting: it asks «Wie war\'s?» with words like «Gschafft» or «Streng».': 'Tippe am Abend (ab 18 Uhr) auf den Gruss: er fragt «Wie war\'s?» mit Wörtern wie «Gschafft» oder «Streng».',
  },
};
