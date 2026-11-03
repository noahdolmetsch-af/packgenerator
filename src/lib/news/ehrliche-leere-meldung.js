// «Noch keine Wartungsdaten» (Noah 1.11.2026 «1a»): without a bike the app no longer says «nothing due»
export default {
  title: 'Honest when there is no data',
  lead: 'Without a bike the app no longer says «nothing due». It says there is no data yet.',
  points: [{ text: 'Planning the week and asking «what is due?» say «No bikes yet» instead of «nothing due»', go: { href: '#/week/plan', where: 'Woche planen, step «Bike service», while no bike exists.' } }],
  small: [],
  test: ['With no bike yet, open Plan the week and go to the step «Bike service»: it says there is no service data.', 'Add a bike: the usual line «Nothing due at the bike» comes back.'],
  since: [],
  de: {
    'Honest when there is no data': 'Ehrlich, wenn Daten fehlen',
    'Without a bike the app no longer says «nothing due». It says there is no data yet.': 'Ohne Velo sagt die App nicht mehr «nichts fällig», sondern dass noch keine Daten da sind.',
    'Planning the week and asking «what is due?» say «No bikes yet» instead of «nothing due»': 'Woche planen und die Frage «Was ist fällig?» sagen «Noch keine Velos» statt «nichts fällig»',
    'Woche planen, step «Bike service», while no bike exists.': 'Woche planen, Schritt «Velo-Service», solange kein Velo da ist.',
    'With no bike yet, open Plan the week and go to the step «Bike service»: it says there is no service data.': 'Öffne ohne Velo «Woche planen» und gehe zum Schritt «Velo-Service»: dort steht, dass noch keine Wartungsdaten da sind.',
    'Add a bike: the usual line «Nothing due at the bike» comes back.': 'Leg ein Velo an: die gewohnte Zeile «Am Velo ist nichts fällig» kommt zurück.',
  },
};
