// «Rollverschluss» (Noah 03.11.2026 «a», Paket B «Packen fühlt sich echt an», Idee 11): a full bag rolls its top shut
// like a real bikepacking bag, on the packing day and on the drawn bike; the buckle clicks with a short buzz
export default {
  title: 'The bag rolls shut',
  lead: 'A bag you have packed completely rolls its top shut.',
  points: [{ text: 'Tick the last item of a bag: its top rolls shut and the buckle clicks into place', go: { href: '#/pack?day', steps: [{ sel: '[data-bag-roll]' }], where: 'Shows while you pack a trip.' } }],
  small: [{ box: 'nicer', text: 'On the drawn bike a full bag closes its top too; the click is a short buzz and stays off with «Reduce motion» or the switch «Short vibration when ticking»', go: null }],
  test: ['Open a trip on its packing day and tap «Pack»: next to the title of the open bag a small bag stands with its mouth open.', 'Tick the last open item of that bag: the top of the small bag rolls shut, then the page moves on to the next bag.'],
  since: [],
  de: {
    'The bag rolls shut': 'Die Tasche rollt zu',
    'A bag you have packed completely rolls its top shut.': 'Eine fertig gepackte Tasche rollt ihren Verschluss zu.',
    'Tick the last item of a bag: its top rolls shut and the buckle clicks into place': 'Hake das letzte Teil einer Tasche ab: Ihr Verschluss rollt zu und die Schnalle rastet ein',
    'On the drawn bike a full bag closes its top too; the click is a short buzz and stays off with «Reduce motion» or the switch «Short vibration when ticking»': 'Auf dem gezeichneten Velo schliesst eine volle Tasche ihren Verschluss auch; der Klick ist ein kurzes Vibrieren und bleibt bei «Bewegung reduzieren» oder ausgeschaltetem «Kurzes Vibrieren beim Abhaken» aus',
    'Open a trip on its packing day and tap «Pack»: next to the title of the open bag a small bag stands with its mouth open.': 'Öffne eine Tour am Packtag und tippe «Packen»: Neben dem Titel der offenen Tasche steht eine kleine Tasche mit offener Öffnung.',
    'Tick the last open item of that bag: the top of the small bag rolls shut, then the page moves on to the next bag.': 'Hake das letzte offene Teil dieser Tasche ab: Der Verschluss der kleinen Tasche rollt zu, danach springt die Seite zur nächsten Tasche.',
  },
};
