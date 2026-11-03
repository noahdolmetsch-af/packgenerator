// «Video-Link statt Datei» (Noah 28.10.2026 «2a»): the video stays on the phone or on its site, the note keeps the link
export default {
  title: 'Keep a link to a video',
  lead: 'A link to a video in a note shows as a video link. The video stays where it is.',
  points: [{ text: 'A link to YouTube, Vimeo or similar in a note gets a play symbol', href: '#/notes', go: 'f.noteattach' }],
  small: [{ box: 'nicer', text: 'A video longer than 1 minute now says: keep it on the phone and add its link', go: 'f.noteattach' }],
  test: [
    'Open a note, tap «Link» and add a link to a video, for example from YouTube.',
    'The link shows a play symbol and «Video link: the video stays where it is».',
    'Add an ordinary web address: it stays an ordinary link.',
  ],
  since: [],
  de: {
    'Keep a link to a video': 'Einen Link zu einem Video behalten',
    'A link to a video in a note shows as a video link. The video stays where it is.': 'Ein Link zu einem Video in einer Notiz erscheint als Video-Link. Das Video bleibt, wo es ist.',
    'A link to YouTube, Vimeo or similar in a note gets a play symbol': 'Ein Link zu YouTube, Vimeo oder Ähnlichem in einer Notiz bekommt ein Abspiel-Symbol',
    'A video longer than 1 minute now says: keep it on the phone and add its link': 'Ein Video über 1 Minute sagt jetzt: Lass es im Handy und füge den Link hinzu',
    'Open a note, tap «Link» and add a link to a video, for example from YouTube.': 'Öffne eine Notiz, tippe «Link» und füge einen Link zu einem Video hinzu, zum Beispiel von YouTube.',
    'The link shows a play symbol and «Video link: the video stays where it is».': 'Der Link zeigt ein Abspiel-Symbol und «Video-Link: das Video bleibt, wo es ist».',
    'Add an ordinary web address: it stays an ordinary link.': 'Füge eine gewöhnliche Webadresse hinzu: Sie bleibt ein gewöhnlicher Link.',
  },
};
