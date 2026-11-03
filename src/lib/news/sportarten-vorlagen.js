// «Meine Sportarten: Vorlagen und Zielvorschlag» (Noah 02.11.2026 «5a»)
export default {
  title: 'Templates and goal suggestions for sports',
  lead: 'A new sport can start from a template, and a sport you do often can get a goal that fits.',
  points: [
    { text: 'New sport: start from a template (for example strength training, running, yoga) that fills name, symbol and goal', go: { href: '#/flow/new', where: 'The templates stand at the top of the form «New sport».', steps: [{ sel: '[data-templates]' }] } },
    { text: 'A goal suggestion from your last 4 weeks, only when it differs from your goal, with «Do not show again»', go: { href: '#/flow/sports', where: 'Shows in a sport’s goal form once you have done it at least 4 times in 4 weeks.' } },
  ],
  small: [],
  test: [
    'Open Aktiv › Meine Sportarten › «New sport» and tap a template, for example «Strength training».',
    'Change the name or the goal as you like; nothing is saved before «Save».',
    'Open a sport you do often (⋯ › Edit): under the goal a suggestion may show; «Do not show again» switches it off.',
  ],
  since: [],
  de: {
    'The templates stand at the top of the form «New sport».': 'Die Vorlagen stehen oben im Formular «Neue Sportart».',
    'Shows in a sport’s goal form once you have done it at least 4 times in 4 weeks.': 'Erscheint im Zielformular einer Sportart, sobald du sie in 4 Wochen mindestens 4× gemacht hast.',
    'Templates and goal suggestions for sports': 'Vorlagen und Zielvorschläge für Sportarten',
    'A new sport can start from a template, and a sport you do often can get a goal that fits.': 'Eine neue Sportart kann mit einer Vorlage starten, und eine Sportart, die du oft machst, kann ein passendes Ziel bekommen.',
    'New sport: start from a template (for example strength training, running, yoga) that fills name, symbol and goal': 'Neue Sportart: mit einer Vorlage starten (zum Beispiel Krafttraining, Laufen, Yoga), die Name, Symbol und Ziel einträgt',
    'A goal suggestion from your last 4 weeks, only when it differs from your goal, with «Do not show again»': 'Ein Zielvorschlag aus deinen letzten 4 Wochen, nur wenn er von deinem Ziel abweicht, mit «Nicht mehr anzeigen»',
    'Open Aktiv › Meine Sportarten › «New sport» and tap a template, for example «Strength training».': 'Öffne Aktiv › Meine Sportarten › «Neue Sportart» und tippe auf eine Vorlage, zum Beispiel «Krafttraining».',
    'Change the name or the goal as you like; nothing is saved before «Save».': 'Ändere Name oder Ziel nach Wunsch; erst mit «Speichern» wird etwas gespeichert.',
    'Open a sport you do often (⋯ › Edit): under the goal a suggestion may show; «Do not show again» switches it off.': 'Öffne eine Sportart, die du oft machst (⋯ › Bearbeiten): unter dem Ziel kann ein Vorschlag stehen; «Nicht mehr anzeigen» schaltet ihn aus.',
  },
};
