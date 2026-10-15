// TZ-2 «Fest nach der Fahrt» (mockup TZ2, Noah 13.10.2026 «1-5 a», «TZ1–TZ3 freigegeben»): the packing list
// of a completed or rated trip is fixed, «Wieder öffnen» asks once, «Bist du gefahren?» for a trip whose
// date passed (trip/StateNote.svelte, trip/ReopenSheet.svelte, Pack, Heute).
export default {
  // the state's band under the step bar
  'Planned: everything stays changeable.': 'Geplant: alles bleibt änderbar.',
  'You can change the packing list, date, bike and weather any time.': 'Packliste, Datum, Velo und Wetter kannst du jederzeit ändern.',
  'You can change the packing list, date and weather any time.': 'Packliste, Datum und Wetter kannst du jederzeit ändern.',
  'You can make a template from this trip.': 'Aus dieser Tour kannst du eine Vorlage machen.',
  'Date passed. Did you ride?': 'Datum vorbei. Bist du gefahren?',
  'Date passed. Did you go?': 'Datum vorbei. Hat sie stattgefunden?',
  '«Yes» ends the trip and fixes its packing list, then the debrief comes. «Not ridden» takes it out of your trips.':
    '«Ja» schliesst die Tour ab, die Packliste wird fest, dann kommt der Rückblick. «Nicht gefahren» nimmt sie aus deinen Touren.',
  '«Yes» ends the trip and fixes its packing list, then the debrief comes. «Did not happen» takes it out of your trips.':
    '«Ja» schliesst die Tour ab, die Packliste wird fest, dann kommt der Rückblick. «Fand nicht statt» nimmt sie aus deinen Touren.',
  'Completed on {date}: this is how you rode.': 'Abgeschlossen am {date}: so bist du gefahren.',
  'Completed on {date}: this is how it went.': 'Abgeschlossen am {date}: so war es.',
  'The packing list is fixed now.': 'Die Packliste ist jetzt fest.',
  'A debrief takes 2 minutes and improves the next trip.': 'Ein Rückblick dauert 2 Minuten und verbessert die nächste Tour.',
  'Rated: debrief saved on {date}': 'Bewertet: Rückblick gespeichert am {date}',
  'Rated: debrief saved.': 'Bewertet: Rückblick gespeichert.',
  'The learnings help the next trip.': 'Die Learnings wirken auf die nächste Tour.',
  'As a template you take the list with all changes from the debrief.': 'Als Vorlage nimmst du die Liste mit allen Änderungen aus dem Rückblick.',
  'Fill in the debrief': 'Rückblick ausfüllen',
  'Change debrief': 'Rückblick ändern',
  Reopen: 'Wieder öffnen',
  'Yes|rode': 'Ja',
  'Not ridden|answer': 'Nicht gefahren',
  'Did not happen': 'Fand nicht statt',
  'Saved: you rode it. The list is fixed now.': 'Gespeichert: du bist gefahren. Die Liste ist jetzt fest.',
  'Marked as not ridden.': 'Als nicht gefahren markiert.',
  'Marked as not gone.': 'Als nicht stattgefunden markiert.',
  // «Wieder öffnen?» (asks once)
  'Reopen this trip?': 'Tour wieder öffnen?',
  'It becomes Planned again: the packing list, date and bike can be changed.': 'Sie wird wieder Geplant: Packliste, Datum und Velo sind dann änderbar.',
  'Your debrief stays saved.': 'Dein Rückblick bleibt gespeichert.',
  'Keep it fixed': 'Fest lassen',
  'Reopened: the trip is planned again.': 'Wieder geöffnet: die Tour ist wieder geplant.',
  // Plan and Pack of a fixed trip
  'No packing list for this trip.': 'Keine Packliste zu dieser Tour.',
  'It was ridden without a list from the app. Reopen it to add one.': 'Sie wurde ohne Liste aus der App gefahren. Öffne sie wieder, um eine anzulegen.',
  'Packing list as ridden': 'Packliste wie gefahren',
  // Heute: the open debrief and the question
  '{title} ({date}): fill in the debrief · 2 min.': '{title} ({date}): Rückblick ausfüllen · 2 Min.',
  '{title} ({date}): date passed. Did you ride?': '{title} ({date}): Datum vorbei. Bist du gefahren?',
  '{title} ({date}): date passed. Did you go?': '{title} ({date}): Datum vorbei. Hat sie stattgefunden?',
  'Saved: you rode {trip}. The list is fixed now.': 'Gespeichert: {trip} gefahren. Die Liste ist jetzt fest.',
  '{trip}: marked as not ridden.': '{trip}: als nicht gefahren markiert.',
};
