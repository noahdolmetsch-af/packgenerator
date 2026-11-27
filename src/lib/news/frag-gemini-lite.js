// «Frag Gemini» hung and then failed (Noah 27.11.2026 17:58): the new Gemini models were «overloaded», the light ones are tried first
export default {
  title: 'Ask Gemini answers faster',
  lead: 'Ask Gemini tries the light Gemini models first and never waits longer than about half a minute.',
  points: [
    { text: 'Ask Gemini tries the light model of the newest version first and asks again once when a model is overloaded', go: null },
  ],
  small: [
    { box: 'fixed', text: 'A question no longer waits for ever: after about half a minute the page says that Gemini did not answer', go: null },
  ],
  test: ['Open the Assistant, tap «Ask Gemini» and ask «Was kostet ein Fahrradschlauch ungefähr?».', 'An answer comes within about half a minute; if not, read the line «Technical detail» under the message and tell it.'],
  since: [],
  de: {
    'Ask Gemini answers faster': 'Frag Gemini antwortet schneller',
    'Ask Gemini tries the light Gemini models first and never waits longer than about half a minute.': 'Frag Gemini probiert zuerst die leichten Gemini-Modelle und wartet nie länger als etwa eine halbe Minute.',
    'Ask Gemini tries the light model of the newest version first and asks again once when a model is overloaded': 'Frag Gemini probiert zuerst das leichte Modell der neuesten Version und fragt einmal nochmals, wenn ein Modell überlastet ist',
    'A question no longer waits for ever: after about half a minute the page says that Gemini did not answer': 'Eine Frage wartet nicht mehr endlos: nach etwa einer halben Minute sagt die Seite, dass Gemini nicht geantwortet hat',
    'Open the Assistant, tap «Ask Gemini» and ask «Was kostet ein Fahrradschlauch ungefähr?».': 'Öffne den Assistenten, tipp «Frag Gemini» und frag «Was kostet ein Fahrradschlauch ungefähr?».',
    'An answer comes within about half a minute; if not, read the line «Technical detail» under the message and tell it.': 'Eine Antwort kommt innert etwa einer halben Minute; wenn nicht, lies die Zeile «Technische Angabe» unter der Meldung vor und sag sie mir.',
  },
};
