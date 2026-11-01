// «Standbild aus Video» (Noah 28.10.2026 «2a»): a video stays on the phone, the app keeps one picture of it
export default {
  title: 'A picture from your video',
  lead: 'Stop a video in a note where you like it and keep that picture as a photo of the note.',
  points: [{ text: 'Open a video in a note and tap «Keep this picture»', href: '#/notes', go: 'f.noteattach' }],
  small: [],
  test: [
    'Open a note, add a short video (File) and tap the video to open it.',
    'Stop the video where you like it and tap «Keep this picture».',
    'Close the video: the picture is now one of the note’s photos, and the video is still there.',
  ],
  since: [],
  de: {
    'A picture from your video': 'Ein Bild aus deinem Video',
    'Stop a video in a note where you like it and keep that picture as a photo of the note.': 'Halte ein Video in einer Notiz an, wo es dir gefällt, und behalte dieses Bild als Foto der Notiz.',
    'Open a video in a note and tap «Keep this picture»': 'Öffne ein Video in einer Notiz und tippe «Dieses Bild behalten»',
    'Open a note, add a short video (File) and tap the video to open it.': 'Öffne eine Notiz, füge ein kurzes Video hinzu (Datei) und tippe es an.',
    'Stop the video where you like it and tap «Keep this picture».': 'Halte das Video an, wo es dir gefällt, und tippe «Dieses Bild behalten».',
    'Close the video: the picture is now one of the note’s photos, and the video is still there.': 'Schliesse das Video: Das Bild ist jetzt eines der Fotos der Notiz, und das Video ist noch da.',
  },
};
