// Kontakt-QR-Code step 4 (Noah 27.10.2026 «5a»): the contact card as a lock-screen image and as a sticker «Found?»
export default {
  title: 'Found?',
  lead: 'Your contact card as a lock-screen image and as a sticker for the bike.',
  points: [
    { text: '«Lock screen»: an image for the phone, so a finder can reach you', href: '#/me/freunde?tab=card', go: { href: '#/me/freunde?tab=card', steps: [{ sel: '[data-contact-card]' }] } },
    { text: '«Sticker Found?»: to print for the bike, the helmet or a bag', href: '#/me/freunde?tab=card', go: { href: '#/me/freunde?tab=card', steps: [{ sel: '[data-contact-card]' }] } },
  ],
  small: [],
  test: [
    'Open Me › With friends › Contact card and tap «Lock screen» under «As an image»: the phone offers the image to save or share.',
    'Tap «Sticker Found?» and scan the image with a second phone: it opens your card page.',
  ],
  since: [],
  de: {
    'Found?': 'Gefunden?',
    'Your contact card as a lock-screen image and as a sticker for the bike.': 'Deine Kontaktkarte als Sperrbildschirm-Bild und als Sticker fürs Velo.',
    '«Lock screen»: an image for the phone, so a finder can reach you': '«Sperrbildschirm»: ein Bild fürs Handy, damit dich erreicht, wer es findet',
    '«Sticker Found?»: to print for the bike, the helmet or a bag': '«Sticker Gefunden?»: zum Drucken fürs Velo, den Helm oder eine Tasche',
    'Open Me › With friends › Contact card and tap «Lock screen» under «As an image»: the phone offers the image to save or share.':
      'Öffne Ich › Mit Freunden › Kontaktkarte und tippe unter «Als Bild» auf «Sperrbildschirm»: Das Handy bietet das Bild zum Speichern oder Teilen an.',
    'Tap «Sticker Found?» and scan the image with a second phone: it opens your card page.':
      'Tippe «Sticker Gefunden?» und scanne das Bild mit einem zweiten Handy: Es öffnet deine Kartenseite.',
  },
};
