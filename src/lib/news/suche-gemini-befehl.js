// «Mit der App sprechen», Etappe 2 (Noah 07.11.2026 «1b 2a 3a 4a 5a»): Gemini turns a free sentence into actions, shown first
export default {
  title: 'Free sentences in the search',
  lead: 'Say what you want in your own words. Gemini turns it into actions, you see them first and tap «OK».',
  points: [
    {
      text: 'A sentence the app does not know, like «Put pumping the tyres on Friday and remember the brake squeaks», shows «I would do this» with Gemini',
      go: { href: '#/me/suche', steps: [{ sel: '[data-suche="understand"]' }], where: 'Me › Search, the switch «Gemini understands sentences». It needs the helper code (Me › AI helper).' },
    },
    { text: 'Only the sentence, the day and the names of your bikes and trips go to Gemini', go: { href: '#/me/suche', steps: [{ sel: '[data-suche="understand"]' }] } },
  ],
  small: [],
  test: [
    'In Me › AI helper the helper code is saved. Type in the search at the top: «Put pumping the tyres on Friday and remember the brake squeaks».',
    'Tap «Let Gemini understand it»: «I would do this» lists the actions with a tick each. Nothing is written yet.',
    'Tap «OK»: it is entered, «Undo» takes it back. In Me › Search the switch «Gemini understands sentences» turns it off.',
  ],
  since: [],
  de: {
    'Free sentences in the search': 'Freie Sätze in der Suche',
    'Say what you want in your own words. Gemini turns it into actions, you see them first and tap «OK».': 'Sag in eigenen Worten, was du willst. Gemini macht Aktionen daraus, du siehst sie zuerst und tippst auf «OK».',
    'A sentence the app does not know, like «Put pumping the tyres on Friday and remember the brake squeaks», shows «I would do this» with Gemini': 'Ein Satz, den die App nicht kennt, etwa «Trag das Reifenpumpen auf Freitag ein und merk dir, dass die Bremse quietscht», zeigt mit Gemini «Ich würde das tun»',
    'Me › Search, the switch «Gemini understands sentences». It needs the helper code (Me › AI helper).': 'Ich › Suche, der Schalter «Gemini versteht Sätze». Er braucht den Helfer-Code (Ich › KI-Helfer).',
    'Only the sentence, the day and the names of your bikes and trips go to Gemini': 'Nur der Satz, der Tag und die Namen deiner Velos und Touren gehen an Gemini',
    'In Me › AI helper the helper code is saved. Type in the search at the top: «Put pumping the tyres on Friday and remember the brake squeaks».': 'In Ich › KI-Helfer ist der Helfer-Code gespeichert. Tippe oben in die Suche: «Trag das Reifenpumpen auf Freitag ein und merk dir, dass die Bremse quietscht».',
    'Tap «Let Gemini understand it»: «I would do this» lists the actions with a tick each. Nothing is written yet.': 'Tippe auf «Gemini verstehen lassen»: «Ich würde das tun» listet die Aktionen mit je einem Haken. Noch wird nichts geschrieben.',
    'Tap «OK»: it is entered, «Undo» takes it back. In Me › Search the switch «Gemini understands sentences» turns it off.': 'Tippe auf «OK»: es wird eingetragen, «Rückgängig» nimmt es zurück. In Ich › Suche schaltet der Schalter «Gemini versteht Sätze» es aus.',
  },
};
