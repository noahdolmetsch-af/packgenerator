/**
 * v0.46.0 «Startseite neu»: the 16 things the app can do (functions.js has the rules around them).
 * v0.94.0 «Kachel-Wand»: on its own, without imports, so tiles.js and the browser tests can read it.
 *
 * label: English key for t(); icon: a key of the icon map in SmallTile.svelte;
 * go: { href } a page or { run } an action Home.svelte carries out;
 * pitch: one sentence for "Tried it yet?".
 */
export const FUNCTIONS = [
  { id: 'dayride', label: 'Day ride', icon: 'zap', go: { run: 'dayride' }, pitch: 'A day ride in one tap: the list of your last one, with the weather.' },
  { id: 'trip', label: 'Plan a trip', icon: 'bag', go: { run: 'trip' }, pitch: 'Plan a trip: name, date and bike, the packing list follows.' },
  { id: 'wear', label: 'What do I wear?', icon: 'shirt', go: { run: 'wear' }, pitch: 'What do I wear? Your clothes for the coldest hour of the ride.' },
  { id: 'weigh', label: 'Weigh|function', icon: 'scale', go: { href: '#/gear?tab=weigh' }, pitch: 'Weigh your items one after the other: then every total is exact.' },
  { id: 'care', label: 'Bike care', icon: 'wrench', go: { href: '#/bikes?tab=care' }, pitch: 'Bike care says when the chain, pads and tyres are due.' },
  { id: 'ride', label: 'Upload ride', icon: 'route', go: { href: '#/debrief/ride' }, pitch: 'Upload a ride (GPX): pauses, planned against real, learnings.' },
  { id: 'gear', label: 'Gear|place', icon: 'file', go: { href: '#/gear' }, pitch: 'All your gear with weight, bag and where it was used.' },
  { id: 'wardrobe', label: 'Wardrobe', icon: 'wardrobe', go: { href: '#/wardrobe' }, pitch: 'The wardrobe sorts your clothes from warm to cold, layer by layer.' },
  { id: 'templates', label: 'Templates', icon: 'layers', go: { href: '#/pack/templates' }, pitch: 'Save a good trip as a template and start the next one from it.' },
  { id: 'wish', label: 'Wishlist', icon: 'heart', go: { href: '#/gear?tab=wishlist' }, pitch: 'The wishlist shows which buy saves the most grams per franc.' },
  { id: 'review', label: 'Look back|function', icon: 'chart', go: { href: '#/debrief' }, pitch: 'Your last ride, the last 12 months and your trips compared, on one page.' },
  { id: 'note', label: 'Note · Inbox', icon: 'note', go: { run: 'note' }, pitch: 'A quick note catches an idea or a photo in two taps; you sort it later.' },
  { id: 'km', label: 'Log km', icon: 'counter', go: { run: 'km' }, pitch: 'Type the km on the counter, and Bike care knows what is due.' },
  { id: 'blocks', label: 'Building blocks', icon: 'blocks', go: { href: '#/blocks' }, pitch: 'Building blocks such as sleep, cook or rain bring their items into a trip.' },
  { id: 'favorites', label: 'Favourites', icon: 'star', go: { href: '#/favorites' }, pitch: 'Mark your favourite things with ★ and find them all on one page.' },
  { id: 'debriefs', label: 'Debriefs', icon: 'book', go: { href: '#/pack/past' }, pitch: 'A debrief takes a minute and tells the app what you really used.' },
];
