// «Neuer Schwung» 2b (Noah 26.10.2026 «5b»: Lottie for big moments; 27.10 «viel zu schnell» → slower): the tick on
// «Gepackt» and the other big moments draws itself as a small Lottie animation (player loads only then)
export default {
  title: 'The big tick draws itself',
  lead: 'Big moments get a small animation.',
  points: [{ text: 'On «Packed» and «Trip ended» the tick draws itself in a green circle', href: '#/pack?day' }],
  small: [{ box: 'nicer', text: 'The animation loads only at that moment and stays still with «reduce motion»' }],
  test: ['Pack a trip and tap «Everything is packed», then «Next»: the green circle grows and the tick draws itself.', 'With «reduce motion» on your phone the tick is simply there.'],
  since: [],
  de: {
    'The big tick draws itself': 'Der grosse Haken zeichnet sich',
    'Big moments get a small animation.': 'Grosse Momente bekommen eine kleine Animation.',
    'On «Packed» and «Trip ended» the tick draws itself in a green circle': 'Bei «Gepackt» und «Tour beendet» zeichnet sich der Haken in einem grünen Kreis',
    'The animation loads only at that moment and stays still with «reduce motion»': 'Die Animation lädt erst in diesem Moment und bleibt still bei «Bewegung reduzieren»',
    'Pack a trip and tap «Everything is packed», then «Next»: the green circle grows and the tick draws itself.': 'Packe eine Tour und tippe «Alles ist gepackt», dann «Weiter»: Der grüne Kreis wächst und der Haken zeichnet sich.',
    'With «reduce motion» on your phone the tick is simply there.': 'Mit «Bewegung reduzieren» am Handy ist der Haken einfach da.',
  },
};
