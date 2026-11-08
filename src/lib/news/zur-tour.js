// «Für deine Tour» auf der Wetterseite (UI-Prüfung 07.11.2026 T3, Noah «alle Vorschläge», «5b»): die nächste Tour mit Wetter, Regenzeug und Wegen
export default {
  title: 'Weather for your next trip',
  lead: 'The weather page starts with a card for your next planned trip: its day, the weather, the rain things on your list, and ways on.',
  points: [
    { text: 'The card «For your trip» on the weather page: rain from when, temperature, wind, and how many rain things are packed', go: { href: '#/wetter', steps: [{ sel: '[data-zur-tour]' }] } },
    { text: 'Three ways from the card: the packing list, «What do I wear?» and the best time for a ride', go: { href: '#/wetter', steps: [{ sel: '[data-zt-pack]' }] } },
  ],
  small: [],
  test: [
    'Plan a trip with a start in the next days, then open Trips › Weather: the card «For your trip» is at the top of «Now».',
    'If rain is expected the card shows «Rain things» with how many are packed. Tap «Open packing list»: your list opens.',
    'Tap «What do I wear?»: Today opens with the clothes for the day.',
  ],
  since: [],
  de: {
    'Weather for your next trip': 'Das Wetter für deine nächste Tour',
    'The weather page starts with a card for your next planned trip: its day, the weather, the rain things on your list, and ways on.': 'Die Wetterseite beginnt mit einer Karte für deine nächste geplante Tour: ihr Tag, das Wetter, das Regenzeug auf deiner Liste und Wege weiter.',
    'The card «For your trip» on the weather page: rain from when, temperature, wind, and how many rain things are packed': 'Die Karte «Für deine Tour» auf der Wetterseite: Regen ab wann, Temperatur, Wind und wie viel Regenzeug gepackt ist',
    'Three ways from the card: the packing list, «What do I wear?» and the best time for a ride': 'Drei Wege von der Karte aus: die Packliste, «Was ziehe ich an?» und die beste Zeit für eine Fahrt',
    'Plan a trip with a start in the next days, then open Trips › Weather: the card «For your trip» is at the top of «Now».': 'Plane eine Tour mit Start in den nächsten Tagen und öffne Touren › Wetter: Die Karte «Für deine Tour» steht ganz oben bei «Jetzt».',
    'If rain is expected the card shows «Rain things» with how many are packed. Tap «Open packing list»: your list opens.': 'Wird Regen erwartet, zeigt die Karte «Regenzeug» mit der Zahl der gepackten Teile. Tippe «Packliste öffnen»: Deine Liste öffnet sich.',
    'Tap «What do I wear?»: Today opens with the clothes for the day.': 'Tippe «Was ziehe ich an?»: Heute öffnet sich mit der Kleidung für den Tag.',
  },
};
