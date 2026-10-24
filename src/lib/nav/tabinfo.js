/**
 * «Alles finden 2» (Noah 22.10.2026 «1a»): on a phone the tabs that do not fit stand in the window «Alle n»
 * (nav/PlaceTabs) as tiles: an icon, the name and one sentence what the page is for. Here are the icon and the
 * sentence of each tab, by '<place>:<key>' (the keys of PLACE_TABS in nav.js). A tab without an entry shows its
 * name only. Sentences are English keys for t(). Pure; the guard test tests/tabinfo.test.js checks that every
 * tab of PLACE_TABS has its entry.
 */
export const TAB_INFO = {
  'week:week': ['calendar', 'Your week: appointments, rides and weather day by day'],
  'week:agenda': ['clock', 'Appointments and tasks from your calendar'],
  'week:notes': ['note', 'Notes, lists and checklists'],
  'week:tagebuch': ['book', 'What you write about your day'],
  'week:inbox': ['inbox', 'Notes from on the way, to file later'],
  'week:mail': ['mail', 'Mails that matter for your plans'],
  'week:compass': ['compass', 'What is important to you, and where you stand'],
  'week:alltag': ['basket', 'Shopping, contracts and people you have not seen for long'],
  'week:frei': ['sun', 'Ideas for free time, evenings and journeys'],
  'week:inspiration': ['lightbulb', 'Your own links, key words and ideas'],
  'week:links': ['link', 'SBB, Maps, komoot and your own links'],
  'trips:overview': ['map', 'All tours, planned and ridden'],
  'trips:templates': ['copy', 'Packing lists to start a new tour from'],
  'trips:lookback': ['history', 'Look back: heatmap, new ground, your year'],
  'trips:dreams': ['star', 'Dream tours and races with their season'],
  'trips:ski': ['mountain', 'Ski tours: backpack check, start check, emergency'],
  'trips:travel': ['link', 'Booking, trains and lodging for your tour'],
  'trips:tools': ['wrench', 'Calculator, compass, currencies, time zones and more'],
  'gear:all': ['backpack', 'Everything you own, with weight and use'],
  'gear:clothes': ['shirt', 'Your clothes in layers, for every temperature'],
  'gear:blocks': ['blocks', 'Parts that always travel together'],
  'gear:shop': ['cart', 'What you want to buy next'],
  'gear:supplies': ['box', 'Food and spare parts with their best-before date'],
  'gear:lend': ['hand', 'What you lent out, and to whom'],
  'bikes:overview': ['bike', 'Your bikes, their bags and their km'],
  'bikes:care': ['wrench', 'What is due, wear and the bike diary'],
  'bikes:shop': ['shop', 'Orders and visits to the bike shop'],
  'bikes:fit': ['ruler', 'Parts and measures of every bike'],
  'bikes:rig': ['layers', 'Your setup per bike: bags plan and log'],
  // Aktiv-Umbau (thread «Aktiv neu», branch 2zl9ay): its new tabs, ready for when its nav.js lands
  'active:sports': ['trophy', 'Every sport with its goal, history and page.'],
  'active:rest': ['heart', 'The recovery ring and what does you good after effort.'],
  'analysis:start': ['chart', 'Form, overview and how you are, at a glance.'],
  'analysis:form': ['target', 'Readiness today, 12 weeks and tour readiness.'],
  'analysis:body': ['heart', 'Heart rate, sleep and steps over time.'],
  'analysis:rides': ['route', 'Every ride from Strava.'],
  'analysis:ticks': ['sun', 'What you ticked, evaluated like a ride.'],
  'analysis:history': ['smile', 'Your daily questions and their history.'],
  'analysis:wohl': ['heart', 'What does you good, from your own answers.'],
  'analysis:impulse': ['sparkles', 'Ideas and impulses for free time.'],
  'analysis:insights': ['chart', 'The strongest patterns in your data.'],
  'analysis:weight': ['scale', 'Your weight and its curve.'],
  'analysis:milestones': ['star', 'Stars and trophies of every sport.'],
  'active:today': ['sun', 'Tick off today, rings and the week'],
  'active:meditation': ['flower', 'Timer, log and patterns of your meditation'],
  'active:training': ['dumbbell', 'Every activity from Strava, races and plans'],
  'active:rides': ['route', 'Your rides from Strava, month by month'],
  'active:goals': ['target', 'A goal per activity, for example twice a week'],
  'active:activity': ['trophy', 'Milestones, trophies and the summit book'],
  'active:impulse': ['sparkles', 'Small ideas to tap when you have time'],
  'active:insights': ['chart', 'Resting pulse, sleep and rides together'],
  'active:history': ['smile', 'Your answers to «How are you?» over time'],
  'active:wohl': ['heart', 'What does you good, and how often'],
  'active:weight': ['scale', 'Your weight, voluntary, for watts per kg'],
};

/** The icon and sentence of a tab, or null. */
export const tabInfo = (place, key) => TAB_INFO[`${place}:${key}`] ?? null;
