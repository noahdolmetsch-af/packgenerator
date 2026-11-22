// «Verbesserungs-Logbuch» (Noah 21.11.2026 «freigabe»): the button «Verbessern», step 2 of 4
export default {
  title: 'The button «Improve»',
  lead: 'Write down what could be better right where you see it: tap «Improve», tap the block, say one sentence.',
  points: [
    { text: 'A button «Improve» on every page: tap it, then tap the block you mean; its title becomes the name of the block', go: 'f.logbuch' },
    { text: 'The window has 13 kinds in four groups, how urgent it is, and you can write or dictate one sentence; page, block, time and device are kept with it', go: 'f.logbuch' },
  ],
  small: [{ box: 'new', text: 'The button can be switched off in Me › Appearance › Handling («Improve button»)', go: { href: '#/me/look', steps: [{ sel: 'input[data-op="improve"]' }] } }],
  test: ['Open any page and tap «Improve» (bottom of the screen).', 'Tap a block with a title, pick «Change text», write one sentence and tap «Save»: it shows in Me › Improvement log with the page and the block.'],
  since: [],
  de: {
    'The button «Improve»': 'Der Knopf «Verbessern»',
    'Write down what could be better right where you see it: tap «Improve», tap the block, say one sentence.': 'Halte fest, was besser sein könnte, genau dort, wo du es siehst: «Verbessern» tippen, den Block antippen, einen Satz sagen.',
    'A button «Improve» on every page: tap it, then tap the block you mean; its title becomes the name of the block': 'Ein Knopf «Verbessern» auf jeder Seite: tippen, dann den Block antippen, den du meinst; sein Titel wird zum Namen des Blocks',
    'The window has 13 kinds in four groups, how urgent it is, and you can write or dictate one sentence; page, block, time and device are kept with it': 'Das Fenster hat 13 Arten in vier Gruppen und die Dringlichkeit, du kannst einen Satz schreiben oder diktieren; Seite, Block, Uhrzeit und Gerät werden mitgespeichert',
    'The button can be switched off in Me › Appearance › Handling («Improve button»)': 'Den Knopf kannst du unter Ich › Darstellung › Bedienung ausschalten («Knopf «Verbessern»»)',
    'Open any page and tap «Improve» (bottom of the screen).': 'Öffne irgendeine Seite und tippe auf «Verbessern» (unten auf dem Bildschirm).',
    'Tap a block with a title, pick «Change text», write one sentence and tap «Save»: it shows in Me › Improvement log with the page and the block.': 'Tippe auf einen Block mit Titel, wähle «Text ändern», schreib einen Satz und tippe auf «Speichern»: er steht unter Ich › Verbesserungs-Logbuch mit Seite und Block.',
  },
};
