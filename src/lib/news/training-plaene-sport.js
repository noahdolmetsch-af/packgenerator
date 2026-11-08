// «Training verbessern» 10 «Pläne für Skitouren, Wandern, Laufen, Kraft» (Noah 03.11.2026, «1-3 a» 07.11.2026)
export default {
  title: 'More training plans: ski tours, hiking, running, strength, mobility',
  lead: 'Five new sample plans next to the ultracycling ones. Their sessions go into your week plan as hiking, running or strength. Ski tours, hiking and running ask for a date instead of a race day, and a second plan can run next to the first.',
  points: [
    { text: 'Under Training plans: «Ski touring», «Hiking», «Run 10 km», «Strength» and «Mobility and core»', go: { href: '#/flow/plans', steps: [{ sel: '[data-plan="skitour"]' }] } },
    { text: 'A second plan: «Add it (both run)» or «Replace the other»', go: { href: '#/flow/plans', steps: [{ sel: '[data-plan="strength"]' }] } },
  ],
  small: [],
  test: [
    'Open Aktiv › Training plans: the new plans stand after the cycling plans. Open «Ski touring»: it asks for a date, not a race day.',
    'Tap «Try it» on one plan, then open a second and choose «Add it (both run)»: both stay in your week plan.',
    'Back on Training plans, both are listed under «In use»; «Take out» removes only the one you choose.',
  ],
  since: [],
  de: {
    'More training plans: ski tours, hiking, running, strength, mobility': 'Mehr Trainingspläne: Skitouren, Wandern, Laufen, Kraft, Mobilität',
    'Five new sample plans next to the ultracycling ones. Their sessions go into your week plan as hiking, running or strength. Ski tours, hiking and running ask for a date instead of a race day, and a second plan can run next to the first.': 'Fünf neue Musterpläne neben den Ultracycling-Plänen. Ihre Einheiten kommen als Wandern, Laufen oder Kraft in deinen Wochenplan. Skitouren, Wandern und Laufen fragen nach einem Termin statt nach einem Renntag, und ein zweiter Plan kann neben dem ersten laufen.',
    'Under Training plans: «Ski touring», «Hiking», «Run 10 km», «Strength» and «Mobility and core»': 'Unter Trainingspläne: «Skitour», «Wandern», «Laufen 10 km», «Kraft» und «Mobilität und Rumpf»',
    'A second plan: «Add it (both run)» or «Replace the other»': 'Ein zweiter Plan: «Dazu nehmen (beide laufen)» oder «Den anderen ersetzen»',
    'Open Aktiv › Training plans: the new plans stand after the cycling plans. Open «Ski touring»: it asks for a date, not a race day.': 'Öffne Aktiv › Trainingspläne: Die neuen Pläne stehen nach den Velo-Plänen. Öffne «Skitour»: Er fragt nach einem Termin, nicht nach einem Renntag.',
    'Tap «Try it» on one plan, then open a second and choose «Add it (both run)»: both stay in your week plan.': 'Tippe bei einem Plan «Ausprobieren», öffne dann einen zweiten und wähle «Dazu nehmen (beide laufen)»: Beide bleiben in deinem Wochenplan.',
    'Back on Training plans, both are listed under «In use»; «Take out» removes only the one you choose.': 'Zurück bei den Trainingsplänen stehen beide unter «In Gebrauch»; «Herausnehmen» entfernt nur den, den du wählst.',
  },
};
