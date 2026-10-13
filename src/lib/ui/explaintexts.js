// v0.117.0 «Knöpfe neu» (N4): plain data without imports, so tests can read it too (ui/explain.js uses it).
/** N4: what each button does, keyed by the button's English label key (German in i18n/de/knoepfe.js). */
export const EXPLAIN = {
  // Velopflege
  'Done|task': 'Mark as done (today, current km)',
  'Record …|care': 'Record a service or a measurement with date and km',
  'Replace|part': 'Record the part as newly fitted',
  'Check|verb': 'Look at it and record ok or not ok',
  'Look|check': 'Open the check with all its points',
  'All OK|check': 'Record every point of the check as OK',
  'Remember|task': 'Put it on the task list',
  'Wishlist|put': 'Put it on the wishlist',
  'Send|order': 'Share or send the workshop order',
  'Pick-up': 'Open the pick-up check for the bike shop',
  'Not needed|care': 'Take it off «Due now»',
  'Work needed': 'Record that work is needed on it',
  'All OK|task': 'Checked, nothing to do',
  'Priority|task': 'How urgent it is: high, medium or low',
  'For the bike shop': 'Put it on the workshop order',
  // Everywhere
  Save: 'Save the changes',
  Cancel: 'Close without saving',
  Undo: 'Take back the last step',
  Delete: 'Delete for good (asks first)',
  Share: 'Pass it on as text or file',
  Tick: 'Mark as packed',
  Later: 'Hide for now, it comes back',
  Close: 'Close, nothing is lost',
  More: 'Opens the list with everything else',
  Edit: 'Change name, date and note',
  New: 'New trip, new part or new note',
};
