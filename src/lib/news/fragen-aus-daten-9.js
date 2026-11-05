// «Fragen aus deinen Daten», Stufe 2, Zufallsfrage (Noah 04.11.2026 «3a»): eine Frage am Tag aus den ausgeschalteten Musterfragen, mit «Nie mehr»
export default {
  title: 'A random question in your daily check',
  lead: 'Once a day the check asks one question from your sample questions that are switched off, and you can say «Never again».',
  points: [
    { text: 'One random question a day from the sample questions you did not switch on, marked «a random question»', go: 'f.datenfragen' },
    { text: '«Never again» takes a question out for good, «Skip» only for today', go: 'f.datenfragen' },
    { text: 'A switch under Me › Your questions turns it off; «Bring them back» undoes «Never again»', go: { href: '#/me/abfragen', steps: [{ sel: '[data-datenfragen]' }] } },
  ],
  test: [
    'Open the morning check: at the end of the questions from your data there can be one marked «a random question».',
    'Tap «Never again» on it: no other random question comes today.',
    'Open Me › Your questions: «A random question» shows how many you removed, and «Bring them back» lets them return.',
  ],
  since: [],
  de: {
    'A random question in your daily check': 'Eine Zufallsfrage im Tagescheck',
    'Once a day the check asks one question from your sample questions that are switched off, and you can say «Never again».': 'Einmal am Tag stellt der Check eine Frage aus deinen ausgeschalteten Musterfragen, und du kannst «Nie mehr» sagen.',
    'One random question a day from the sample questions you did not switch on, marked «a random question»': 'Eine Zufallsfrage am Tag aus den Musterfragen, die du nicht eingeschaltet hast, als «eine Zufallsfrage» gekennzeichnet',
    '«Never again» takes a question out for good, «Skip» only for today': '«Nie mehr» nimmt eine Frage für immer heraus, «Überspringen» nur für heute',
    'A switch under Me › Your questions turns it off; «Bring them back» undoes «Never again»': 'Ein Schalter unter Ich › Deine Abfragen schaltet sie aus; «Wieder zulassen» macht «Nie mehr» rückgängig',
    'Open the morning check: at the end of the questions from your data there can be one marked «a random question».': 'Öffne den Morgen-Check: nach den Fragen aus deinen Daten kann eine als «Zufallsfrage» gekennzeichnete stehen.',
    'Tap «Never again» on it: no other random question comes today.': 'Tippe dort auf «Nie mehr»: Heute kommt keine andere Zufallsfrage.',
    'Open Me › Your questions: «A random question» shows how many you removed, and «Bring them back» lets them return.': 'Öffne Ich › Deine Abfragen: «Eine Zufallsfrage» zeigt, wie viele du entfernt hast, und «Wieder zulassen» holt sie zurück.',
  },
};
