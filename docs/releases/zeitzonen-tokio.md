# Tokio im Zeitzonen-Werkzeug

Auftrag: Noah «Ok» (Thread «Prüfen roten Nacht-Rundgang»). Der Nacht-Rundgang war seit dem 07.11.2026 rot, weil `#/me/tools/zones` den Vorschlag «Tokyo» zeigte. Das Wörterbuch kennt «Tokyo» als englischen Text (`Tokyo: 'Tokio'`), der Test meldete ihn deshalb als unübersetzt.

## Was ist neu
- Der vorgeschlagene vierte Ort heisst «Tokio» (`src/lib/tools/zones.js`). Die Zeitzone bleibt `Asia/Tokyo`.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Namen im Vorschlag sind Eigennamen und gehen nicht durch `t()`; deshalb wurde der Name selbst deutsch, statt den Test zu lockern.
- Orte, die schon gespeichert sind, behalten ihren Namen («Tokyo»). Man kann jeden Ort umbenennen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Werkzeugkasten › Zeitzonen mit einer frischen Liste: Zürich, London, New York, Tokio.
