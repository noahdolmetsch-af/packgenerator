// Durchklick 4a und Fund 1 (Noah 22.11.2026 «4a», «1a»): the sentence on Heute is tappable; small controls are easier to hit
export default {
  title: 'Heute: the sentence jumps to the list',
  lead: '«Seven things are up today» is tappable now and leads to the list «Up now». Small chips and quiet buttons are easier to hit on the phone.',
  points: [
    { text: 'Tap «n things are up today» under the greeting: the page jumps to «Up now»', go: { href: '#/', steps: [{ sel: '[data-say-jump]' }] } },
  ],
  small: [{ box: 'new', text: 'Small chips and quiet buttons have a full tap area on the phone, the look stays the same', go: null }],
  test: [
    'Open Heute. Under the greeting tap «n things are up today ↓»: the page jumps to the list «Up now».',
    'On the phone: tap just beside a small chip or «Not this week»-like button: it still opens.',
  ],
  since: [],
  de: {
    'Heute: the sentence jumps to the list': 'Heute: Der Satz springt zur Liste',
    '«Seven things are up today» is tappable now and leads to the list «Up now». Small chips and quiet buttons are easier to hit on the phone.': '«Heute sind 7 Dinge dran» ist jetzt antippbar und führt zur Liste «Jetzt dran». Kleine Chips und stille Knöpfe sind am Handy leichter zu treffen.',
    'Tap «n things are up today» under the greeting: the page jumps to «Up now»': '«Heute sind n Dinge dran» unter dem Gruss antippen: die Seite springt zu «Jetzt dran»',
    'Small chips and quiet buttons have a full tap area on the phone, the look stays the same': 'Kleine Chips und stille Knöpfe haben am Handy eine volle Tippfläche, das Aussehen bleibt gleich',
    'Open Heute. Under the greeting tap «n things are up today ↓»: the page jumps to the list «Up now».': 'Heute öffnen. Unter dem Gruss «Heute sind n Dinge dran ↓» antippen: die Seite springt zur Liste «Jetzt dran».',
    'On the phone: tap just beside a small chip or «Not this week»-like button: it still opens.': 'Am Handy knapp neben einen kleinen Chip oder stillen Knopf tippen: er öffnet sich trotzdem.',
  },
};
