/**
 * «Heute als Begleiter» PR 12 (Noah 28.10.2026 «1a 2a 3a», Funktionsliste): the gestures, keys, search commands and «⋯»
 * actions that no catalogue line explains, as one list on «Help and functions» (Features.svelte).
 * English keys for t(); `go` is a place where it can be tried (empty: everywhere).
 */
export const TRICKS = [
  {
    key: 'gesture',
    label: 'Gestures|tricks',
    items: [
      { id: 'g.tabswipe', title: 'Swipe between tabs', text: 'Phone: swipe sideways over the page to open the next or the previous tab; dots show where you are.', go: '#/flow' },
      { id: 'g.homehold', title: 'Adjust Today with a long press', text: 'Press a tile for a long time to open «Adjust»: move, size, hide.' },
      { id: 'g.explain', title: 'Bubble on buttons', text: 'Computer: hold the mouse over a button; phone: press it for a long time. A bubble says what the button does.', go: '#/bikes?tab=care' },
      { id: 'g.broken', title: 'Mark a part as broken', text: 'In the debrief press a part for a long time (or right-click): it is marked as broken.', go: '#/debrief' },
      { id: 'g.tickhold', title: 'Tick with place and duration', text: 'Active: a short tap ticks it, a long press (or right-click) asks for place and duration.', go: '#/flow' },
      { id: 'g.tilehold', title: 'Tile menu with a long press', text: 'Tools and links: press a tile for a long time to open its menu (hide, move to the front).', go: '#/me/links' },
      { id: 'g.ridenote', title: 'Edit a note on the way', text: 'On the way: press a note for a long time to open its menu.', go: '#/ride' },
      { id: 'g.racepoint', title: 'Set a point on the race map', text: 'Race › Map: press the map for a long time to set your own point with a note.', go: '#/race' },
      { id: 'g.gearswipe', title: 'Swipe a gear row', text: 'Phone: to the right for favourite and assign, to the left for delete or archive, always with Undo.', go: '#/gear' },
      { id: 'g.packswipe', title: 'Packing list: swipe to tick', text: 'Phone: swipe a row to the right to tick the item (a tap still works).', go: '#/pack?day' },
      { id: 'g.drag', title: 'Drag to sort', text: 'In every sortable list: drag by the handle or move with the arrows ↑↓.', go: '#/me/lists' },
      { id: 'g.back', title: 'Back closes the window first', text: 'Android back, browser back or swipe back closes an open window, the page stays; what you typed stays.' },
      { id: 'g.beside', title: 'Tap beside the window', text: 'A tap beside a window closes it like Escape; what you typed stays.' },
      { id: 'g.lightbox', title: 'Look at a photo big', text: 'A photo fills the screen; swipe or use the arrow keys for the next one.', go: '#/me/album' },
      { id: 'g.yearstory', title: 'Page through the year as pictures', text: 'Tap right or left, swipe or use the arrow keys to go one slide forward or back.', go: '#/jahr' },
      { id: 'g.homeswipe', title: 'Next trip on Today', text: 'Swipe the trip card on Today sideways to see the next planned trip («1 / 3 ›»).' },
      { id: 'g.livepages', title: 'Data pages on the live map', text: 'On the way on the live map: swipe sideways over the strip to change the data pages.', go: '#/live' },
      { id: 'g.tripname', title: 'Overwrite the trip name', text: 'Tapping the trip name marks the whole automatic name; typing replaces it.', go: '#/pack' },
      { id: 'g.appicon', title: 'Press the app icon for a long time', text: 'On the phone: press the app icon for a long time to offer «New note» and «Start a ride».', go: '#/inbox/new' },
      { id: 'g.share', title: 'Share to Pack Generator', text: 'Share from another app: text goes to the inbox, a link to Inspiration, a GPX file to «Upload a ride», a picture to Documents, a backup (.json) to «Check import».', go: '#/inbox' },
      { id: 'g.bookmark', title: 'Bookmark «Into the inbox»', text: 'A browser bookmark puts the open web page straight into the inbox as an entry.', go: '#/inbox' },
    ],
  },
  {
    key: 'keys',
    label: 'Keys|tricks',
    items: [
      { id: 'g.keys', title: 'Keyboard shortcuts on the computer', text: 'g then h/t/m/v/a opens Today, Trips, Gear, Bikes, Active; / searches, n opens «New», i opens «Me», ? shows all shortcuts.' },
      { id: 'g.mapzoom', title: 'Zoom maps with + and −', text: 'On the trip map, the heat map and the elevation profile the keys + and − zoom.', go: '#/heatmap' },
      { id: 'g.drawdel', title: 'Sketch: delete the selection', text: 'While drawing, Del or Backspace deletes the selected element.', go: '#/notes' },
    ],
  },
  {
    key: 'search',
    label: 'Search commands|tricks',
    items: [
      { id: 's.weigh', title: 'Search: «wiegen»', text: 'Type «wiegen» in the search: starts weighing.' },
      { id: 's.dayride', title: 'Search: «schnellstart [bike]»', text: 'Plans a ride for today at once, with the bike you name.' },
      { id: 's.chain', title: 'Search: «kette geölt [bike]»', text: 'Enters «chain oiled/waxed» with today’s date for the bike, with Undo.' },
      { id: 's.sealant', title: 'Search: «dichtmilch [bike]»', text: 'Enters «sealant refilled» for the bike.' },
      { id: 's.wash', title: 'Search: «gewaschen [bike]»', text: 'Enters «bike washed» with today’s date.' },
      { id: 's.km', title: 'Search: «km nachtragen»', text: 'Opens adding kilometres afterwards.' },
      { id: 's.note', title: 'Search: «notiz [text]»', text: 'Puts the text straight into the inbox as a note.' },
      { id: 's.wear', title: 'Search: «was ziehe ich an»', text: 'Opens the clothing suggestion for today.' },
      { id: 's.trip', title: 'Search: «tour planen»', text: 'Opens a new trip.' },
      { id: 's.goto', title: 'Search: «backup», «einstellungen», a bike name', text: 'Jumps to Data and backup, to Look and operation, or to the page of the bike you name.' },
    ],
  },
  {
    key: 'more',
    label: 'Under the «⋯»|tricks',
    items: [
      { id: 'm.savetemplate', title: 'Save a trip as a template', text: 'In the ⋯ of a finished trip: make a template for the next one from it.', go: '#/trips' },
      { id: 'm.duplicate', title: 'Duplicate a template', text: 'In the ⋯ of a template: a copy to change.', go: '#/pack/templates' },
      { id: 'm.copysetup', title: 'Copy a setup to another bike', text: 'In the ⋯ of a bag setup: take the same setup over for another bike.', go: '#/bikes?tab=rig' },
      { id: 'm.workshopbook', title: 'Book a workshop appointment', text: 'In bike care: enter the link to the workshop and book an appointment right away.', go: '#/bikes?tab=care' },
      { id: 'm.parktool', title: 'Instructions at Park Tool', text: 'On a care task: open the matching instructions (in English).', go: '#/bikes?tab=care' },
      { id: 'm.warranty', title: 'Maker and warranty link', text: 'In the bike setup: enter or change the link to the maker and the warranty.', go: '#/bikes?tab=rig' },
      { id: 'm.shoplink', title: 'Shop link on gear', text: 'In the ⋯ of a part: enter or change the shop link.', go: '#/gear' },
      { id: 'm.strava', title: 'Open a trip in Strava', text: 'In the ⋯ of a trip: open the activity in Strava.', go: '#/trips' },
      { id: 'm.tourout', title: 'Detach a ride from a trip', text: 'In the ⋯ of a trip: separate a ride from the trip again.', go: '#/trips' },
      { id: 'm.tiles', title: 'Adjust tiles / move to the front', text: 'In the ⋯ of Tools and links: arrange tiles, bring them to the front, hide them.', go: '#/me/links' },
      { id: 'm.anaadjust', title: 'Adjust analyses', text: 'In the ⋯ of a training analysis: change the order and visibility of the analyses.', go: '#/flow/training' },
      { id: 'm.priority', title: 'Priority and solution for bike problems', text: 'In the ⋯ of a problem: set a priority, «Work needed» or take the suggested solution.', go: '#/bikes?tab=care' },
      { id: 'm.setupphoto', title: 'Setup photo: show behind the bike, change the date', text: 'In the ⋯ of a setup photo: show it as the background of the bike or change its date.', go: '#/bikes?tab=rig' },
      { id: 'm.fileelse', title: 'Inbox: file somewhere else', text: 'In the ⋯ of an inbox entry: move it to another place.', go: '#/inbox' },
      { id: 'm.favstop', title: 'Favourites: stop suggesting', text: 'In the ⋯ of a favourite: remove the star or stop suggesting it.', go: '#/favorites' },
      { id: 'm.bowl', title: 'Choose a singing bowl', text: 'More on meditation: choose the sound of the singing bowl (e.g. deep).', go: '#/flow/act/meditation/mehr' },
    ],
  },
];

/** The entries that match a search text (title or text, English or the shown language). */
export const findTricks = (q, tr = (s) => s) => {
  const words = String(q ?? '').toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length || String(q).trim().length < 2) return null;
  const hay = (x) => [x.title, tr(x.title), x.text, tr(x.text)].join(' ').toLowerCase();
  return new Set(TRICKS.flatMap((g) => g.items).filter((x) => words.every((w) => hay(x).includes(w))).map((x) => x.id));
};
