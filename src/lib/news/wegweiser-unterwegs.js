// «Wegweiser statt Katalog» PR 2 (Noah 01.11.2026 «1a 2a 3a 4a 5a», Inhalte «1-5a»): «Fits here» on the way, tips in the toolbox
export default {
  title: 'Tools where you need them',
  lead: 'On the way, the small tools are right under the helpers.',
  points: [
    {
      text: 'On the way: «Fits here» with phrases abroad, time zones, magnifier and arrival',
      go: { href: '#/ride', steps: [{ sel: '[data-passt-hier="ride"]' }], where: 'Shows on «On the way» while a trip is running.', play: 'ride' },
    },
  ],
  small: [{ box: 'new', text: 'Phrases, time zones and magnifier each have a line «Good to know»', go: 'f.phrases' }],
  test: [
    'Start a trip (or the playground «On the way») and open On the way: under the helpers is «Fits here».',
    'Tap «Phrases abroad»: the page opens with «Good to know» at the top.',
  ],
  since: [],
  de: {
    'Tools where you need them': 'Werkzeuge dort, wo du sie brauchst',
    'On the way, the small tools are right under the helpers.': 'Unterwegs stehen die kleinen Werkzeuge gleich unter den Helfern.',
    'On the way: «Fits here» with phrases abroad, time zones, magnifier and arrival': 'Unterwegs: «Passt hier» mit Sätzen im Ausland, Zeitzonen, Lupe und Ankunft',
    'Shows on «On the way» while a trip is running.': 'Erscheint unter «Unterwegs», während eine Tour läuft.',
    'Phrases, time zones and magnifier each have a line «Good to know»': 'Sätze, Zeitzonen und Lupe haben je eine Zeile «Gut zu wissen»',
    'Start a trip (or the playground «On the way») and open On the way: under the helpers is «Fits here».': 'Starte eine Tour (oder das Beispiel «Unterwegs») und öffne Unterwegs: unter den Helfern steht «Passt hier».',
    'Tap «Phrases abroad»: the page opens with «Good to know» at the top.': 'Tippe auf «Sätze im Ausland»: die Seite öffnet sich mit «Gut zu wissen» oben.',
  },
};
