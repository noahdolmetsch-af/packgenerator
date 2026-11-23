// Fix: two more weather lines of the news say where to look; the night-temperature test no longer depends on timing (Bündler 23.11.2026)
export default {
  title: 'Weather news: two more places',
  lead: 'Two more weather lines in the news now say where to look when the answer is not there yet.',
  points: [{ text: 'The tips «Rain in the next 3 hours» and «Weather today» say where they show later', go: null }],
  test: ['Open Me › What is new and tap the line about the rain of the next three hours: it lights the place on Weather, or says where it shows once the forecast is there.', 'Tap the line about the closed line «Weather today»: it lights it on Today, or says on which day it shows.'],
  de: {
    'Weather news: two more places': 'Wetter-Neuigkeiten: zwei weitere Stellen',
    'Two more weather lines in the news now say where to look when the answer is not there yet.': 'Zwei weitere Wetter-Zeilen in den Neuigkeiten sagen jetzt, wo man hinschaut, wenn die Antwort noch nicht da ist.',
    'The tips «Rain in the next 3 hours» and «Weather today» say where they show later': 'Die Tipps «Regen in den nächsten 3 Stunden» und «Wetter heute» sagen, wo sie später erscheinen',
    'Open Me › What is new and tap the line about the rain of the next three hours: it lights the place on Weather, or says where it shows once the forecast is there.': 'Öffne Ich › Neuigkeiten und tippe die Zeile zum Regen der nächsten drei Stunden: sie leuchtet die Stelle auf Wetter an, oder sagt, wo sie erscheint, sobald die Vorhersage da ist.',
    'Tap the line about the closed line «Weather today»: it lights it on Today, or says on which day it shows.': 'Tippe die Zeile zur geschlossenen Zeile «Wetter heute»: sie leuchtet sie auf Heute an, oder sagt, an welchem Tag sie erscheint.',
  },
};
