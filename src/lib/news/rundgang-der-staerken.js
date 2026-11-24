// «Rundgang der Stärken» (Noah 23.11.2026 «1-5a»): vier Fragen am Muster-Rennen zeigen, was die App kann
export default {
  title: 'Tour of the strengths',
  lead: 'Four questions show on the sample race what the app can do. You only watch, and you can skip any of them.',
  points: [
    { text: 'Me › Handbook › Tour: «Tour of the strengths» with four stations; «Show me ›» opens the real part of the sample race, «Skip» goes on', go: { href: '#/me/handbook', steps: [{ sel: '[data-tour-staerken]' }] } },
    { text: 'The sample race comes along if it is not there yet, marked as a sample; your own data is never touched', go: null },
  ],
  small: [{ box: 'new', text: 'The tour of the places and the small tours per place stay right below' }],
  test: [
    'Open Me › Handbook › Tour and tap «Start ›» at «Tour of the strengths»: the first question «How far do I get with luggage?» appears.',
    'Tap «Show me ›»: the assumptions of the sample race light up. Tap «Next ›», then «Skip» at the next question.',
    'At the end tap «Done ›». Under Trips › Races the sample race stays; «Delete the sample» takes it away.',
  ],
  since: [],
  de: {
    'Tour of the strengths': 'Rundgang der Stärken',
    'Four questions show on the sample race what the app can do. You only watch, and you can skip any of them.': 'Vier Fragen zeigen am Muster-Rennen, was die App kann. Du schaust nur zu und kannst jede überspringen.',
    'Me › Handbook › Tour: «Tour of the strengths» with four stations; «Show me ›» opens the real part of the sample race, «Skip» goes on': 'Ich › Handbuch › Rundgang: «Rundgang der Stärken» mit vier Stationen; «Zeig mir ›» öffnet den echten Teil des Muster-Rennens, «Überspringen» geht weiter',
    'The sample race comes along if it is not there yet, marked as a sample; your own data is never touched': 'Das Muster-Rennen kommt dazu, wenn es noch nicht da ist, als Muster markiert; deine eigenen Daten bleiben unberührt',
    'The tour of the places and the small tours per place stay right below': 'Der Rundgang durch die Orte und die kleinen Rundgänge pro Ort stehen gleich darunter',
    'Open Me › Handbook › Tour and tap «Start ›» at «Tour of the strengths»: the first question «How far do I get with luggage?» appears.': 'Öffne Ich › Handbuch › Rundgang und tippe bei «Rundgang der Stärken» auf «Start ›»: Die erste Frage «Wie weit komme ich mit Gepäck?» erscheint.',
    'Tap «Show me ›»: the assumptions of the sample race light up. Tap «Next ›», then «Skip» at the next question.': 'Tippe auf «Zeig mir ›»: Die Annahmen des Muster-Rennens leuchten auf. Tippe auf «Weiter ›», dann bei der nächsten Frage auf «Überspringen».',
    'At the end tap «Done ›». Under Trips › Races the sample race stays; «Delete the sample» takes it away.': 'Tippe am Ende auf «Fertig ›». Unter Touren › Rennen bleibt das Muster-Rennen; «Muster löschen» nimmt es weg.',
  },
};
