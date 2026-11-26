# Kleider: deine Kleider vor der Wunschliste

PR #<Nummer> · 24.11.2026 · Auftrag: Noah «1-5a» (impeccable ganze App, Paket 10; Thread «Packen nach Taschen am Bike ausbauen»)

## Was ist neu
- Auf der Seite Kleider stehen am Handy zuerst «Velo · Alltag · Alle», die Figur «Deine Zwiebel», «Noch einordnen» und «Aufräumen», dann die Schichten und die Kleider-Sets. Die Wunschliste steht am Ende des Inhalts. Bisher standen «Aufräumen» und die Wunschliste (mit je einem Knopf pro Teil) vor allem anderen; die Figur begann erst nach etwa 1500 Pixeln.

## Was fällt weg oder rutscht tiefer
- nichts fällt weg. Die Wunschliste rutscht am Handy etwa anderthalb Bildschirme tiefer, «Aufräumen» etwa einen. Am Computer ändert sich nichts.

## Selbst entschieden
- Die Wunschliste steht hinter der Legende («°C von …») ganz am Ende, direkt vor «Passt hier», nicht zwischen Schichten und Kits.
- Kein Text und keine Adresse ändern sich. «Was du hier tun kannst 1» (Fund 9, Zahl 1 wirkt leer) bleibt für ein eigenes Paket.
- Wächter: `tests/e2e/kleider-eigene-zuerst.spec.js` prüft die Reihenfolge am Handy und am Computer und «Figur im ersten Bildschirm» (am Handy beginnt sie nach dem Hinweis unter «Velo · Alltag · Alle», vor dem unteren Rand des ersten Bildschirms).

## Entscheide (eigene Datei `docs/decisions/kleider-eigene-zuerst.md`)
- 24.11.2026: eigene Kleider vor der Wunschliste (Noah «1-5a»)

## Stand im Plan (roadmap.md / vorhaben.md)
- impeccable ganze App, Welle 2: Paket 10 (Kleider) gebaut

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Am Handy `#/wardrobe` öffnen: gleich nach «Velo · Alltag · Alle» steht «Deine Zwiebel».
2. Nach unten scrollen: «Noch einordnen» und «Aufräumen» folgen direkt aufeinander, dann die Schichten.
3. Ganz unten steht die Wunschliste mit dem Satz «Nicht deins …».
