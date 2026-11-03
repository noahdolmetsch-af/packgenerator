// «Die App reagiert auch in Packen» (Ideen C2 und C3 «App denkt mit», Noah 03.11.2026 «unbedingt»): both hints in the catalogue
export default {
  title: 'Two Packen hints in the catalogue',
  lead: 'The forecast hint and the bike hint of Packen now have their own entries and a card on «How the app decides».',
  points: [{ text: 'Me › How the app decides: a card «The app also reacts in Packen» names «Weather turned» and «Which bike fits the trip»', href: '#/me/regeln', go: { href: '#/me/regeln', steps: [{ sel: '[data-denkt-mit]' }] } }],
  small: [],
  test: [
    'Open Me › How the app decides: below the title the card «The app also reacts in Packen» names two hints.',
    'Tap «Open Packen»: the hints show there when they apply.',
  ],
  since: ['f.wxturn', 'f.bikefit'],
  de: {
    'Two Packen hints in the catalogue': 'Zwei Hinweise aus Packen im Verzeichnis',
    'The forecast hint and the bike hint of Packen now have their own entries and a card on «How the app decides».': 'Der Wetter-Hinweis und der Velo-Hinweis von Packen haben jetzt eigene Einträge und eine Karte auf «So entscheidet die App».',
    'Me › How the app decides: a card «The app also reacts in Packen» names «Weather turned» and «Which bike fits the trip»': 'Ich › So entscheidet die App: eine Karte «Die App reagiert auch in Packen» nennt «Wetter gedreht» und «Welches Velo passt zur Tour»',
    'Open Me › How the app decides: below the title the card «The app also reacts in Packen» names two hints.': 'Öffne Ich › So entscheidet die App: unter dem Titel nennt die Karte «Die App reagiert auch in Packen» zwei Hinweise.',
    'Tap «Open Packen»: the hints show there when they apply.': 'Tippe «Packen öffnen»: dort erscheinen die Hinweise, wenn sie passen.',
  },
};
