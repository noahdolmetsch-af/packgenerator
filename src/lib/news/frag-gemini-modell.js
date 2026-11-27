// «Frag Gemini» did not answer on a phone (Noah 27.11.2026): the server finds a model that works, the page shows what went wrong
export default {
  title: 'Ask Gemini answers again',
  lead: 'Ask Gemini finds a Gemini model that works by itself, and a failed question shows what went wrong.',
  points: [
    { text: 'Ask Gemini tries the next model when one is gone or refused, and asks the key for the newest one if none of its list works', go: { href: '#/assistent/gemini', steps: [{ sel: '[data-gemini-q]' }] } },
  ],
  small: [
    { box: 'new', text: 'A failed question shows a small technical line, so the cause can be found', go: null },
    { box: 'fixed', text: 'After an answer or an error the result comes to the top, clear of the floating «Improve» button', go: null },
  ],
  test: ['Open the Assistant, tap «Ask Gemini», type «Wie viele Gänge hat ein Rennrad?» and tap «Ask Gemini».', 'If it fails, read the line «Technical detail» under the message and tell it.'],
  since: [],
  de: {
    'Ask Gemini answers again': 'Frag Gemini antwortet wieder',
    'Ask Gemini finds a Gemini model that works by itself, and a failed question shows what went wrong.': 'Frag Gemini findet selbst ein Gemini-Modell, das geht, und eine fehlgeschlagene Frage zeigt, was schiefging.',
    'Ask Gemini tries the next model when one is gone or refused, and asks the key for the newest one if none of its list works': 'Frag Gemini probiert das nächste Modell, wenn eines weg ist oder abgelehnt wird, und fragt den Schlüssel nach dem neuesten, wenn keines aus der Liste geht',
    'A failed question shows a small technical line, so the cause can be found': 'Eine fehlgeschlagene Frage zeigt eine kleine technische Zeile, damit man die Ursache findet',
    'After an answer or an error the result comes to the top, clear of the floating «Improve» button': 'Nach einer Antwort oder einem Fehler springt das Ergebnis nach oben, frei vom schwebenden Knopf «Verbessern»',
    'Open the Assistant, tap «Ask Gemini», type «Wie viele Gänge hat ein Rennrad?» and tap «Ask Gemini».': 'Öffne den Assistenten, tipp «Frag Gemini», schreib «Wie viele Gänge hat ein Rennrad?» und tipp «Frag Gemini».',
    'If it fails, read the line «Technical detail» under the message and tell it.': 'Wenn es nicht klappt, lies die Zeile «Technische Angabe» unter der Meldung vor und sag sie mir.',
  },
};
