// «Nebel auf der Tour-Route» (Noah 05.11.2026 «4b 5b»): the fog line against the planned route, in the tour weather and in the profile
export default {
  title: 'Fog on your route',
  lead: 'The tour weather says where your route lies against the fog line, and the profile shows the fog.',
  points: [
    { text: 'The tour weather says if you start in the fog and from which km you are above it', go: { href: '#/pack', where: 'Plan a tour with a route and a start in the next 3 days: «Weather for this tour», under the best start time.' } },
    { text: 'It names the time when the fog clears, so you can start later', go: { href: '#/pack', where: 'Plan a tour: «Weather for this tour», the fog line.' } },
    { text: 'The elevation profile shows the fog as a grey band up to the fog line', go: { href: '#/pack', where: 'Plan a tour with a route: the elevation profile under the map.' } },
  ],
  small: [],
  test: [
    'Open a planned tour with a route that starts in the next 3 days: «Weather for this tour» has a line about the fog.',
    'Look at the elevation profile of the route: a grey band reaches up to the fog line.',
  ],
  since: [],
  de: {
    'Fog on your route': 'Nebel auf deiner Route',
    'The tour weather says where your route lies against the fog line, and the profile shows the fog.': 'Das Tourwetter sagt, wo deine Route zur Nebelgrenze liegt, und das Profil zeigt den Nebel.',
    'The tour weather says if you start in the fog and from which km you are above it': 'Das Tourwetter sagt, ob du im Nebel startest und ab welchem km du darüber bist',
    'Plan a tour with a route and a start in the next 3 days: «Weather for this tour», under the best start time.': 'Plane eine Tour mit Route und Start in den nächsten 3 Tagen: «Wetter für diese Tour», unter der besten Startzeit.',
    'It names the time when the fog clears, so you can start later': 'Es nennt die Zeit, zu der sich der Nebel auflöst, damit du später starten kannst',
    'Plan a tour: «Weather for this tour», the fog line.': 'Plane eine Tour: «Wetter für diese Tour», die Zeile zum Nebel.',
    'The elevation profile shows the fog as a grey band up to the fog line': 'Das Höhenprofil zeigt den Nebel als graues Band bis zur Nebelgrenze',
    'Plan a tour with a route: the elevation profile under the map.': 'Plane eine Tour mit Route: das Höhenprofil unter der Karte.',
    'Open a planned tour with a route that starts in the next 3 days: «Weather for this tour» has a line about the fog.': 'Öffne eine geplante Tour mit Route, die in den nächsten 3 Tagen startet: «Wetter für diese Tour» hat eine Zeile zum Nebel.',
    'Look at the elevation profile of the route: a grey band reaches up to the fog line.': 'Schau dir das Höhenprofil der Route an: Ein graues Band reicht bis zur Nebelgrenze.',
  },
};
