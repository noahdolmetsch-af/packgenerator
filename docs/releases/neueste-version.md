# Welche Version ist online?

PR #… · 27.10.2026 · Auftrag: Noah «1-5 a» (Thread «Beheben alte Version auf Geräten»), Fragen 1 und 2

## Was ist neu
- Ich › Hilfe hat eine neue Zeile «Version … auf diesem Gerät». Darunter steht die Version, die online ist
  (aus `version.json`, nie aus der Offline-Kopie): «dieses Gerät ist aktuell», «die neue Version wird geladen …»
  oder «Online-Version gerade nicht bekannt (offline?)».
- Der Knopf «Neueste laden» ist immer da. Er lädt die App frisch aus dem Internet (`freshreload.js`), die Daten
  bleiben auf dem Gerät. Ist online eine neuere Version, ist er grün, und die Zeile fragt den Browser sofort nach ihr.

## Was fällt weg oder rutscht tiefer
- nichts. «Was ist neu», «Projekt-Ablage» und alle anderen Zeilen in «Hilfe» rutschen eine Zeile tiefer.

## Selbst entschieden
- Platz: in «Hilfe» direkt vor «Was ist neu», weil beides zur App-Version gehört.
- Die Versionsnummer im Untertitel von Ich und unten auf Heute bleibt, wie sie ist.
- `behind.js` hat dafür die kleine Funktion `onlineVersion()`; der Balken nach 15 Minuten bleibt gleich
  (2 Minuten kommt im nächsten PR, Frage 3).

## Entscheide (für decisions.md)
- 27.10.2026: Neueste Version auf Geräten, Noah «1-5 a»: Versionszeile + Knopf in Ich (dieser PR), Hinweis nach
  2 Minuten und einmal automatisch frisch laden beim Start (nächster PR), «gemergt, noch nicht online» (danach).

## Stand im Plan (roadmap.md / vorhaben.md)
- Neueste Version auf Geräten: Schritt 1 von 3.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne Ich und scrolle zu «Hilfe»: Die Zeile «Version … auf diesem Gerät» zeigt deine Version und die Version online.
2. Steht dort «die neue Version wird geladen …», tippe auf «Neueste laden»: Die App lädt neu, deine Daten sind noch da.
3. Schalte das Handy in den Flugmodus und öffne Ich: Die Zeile sagt «Online-Version gerade nicht bekannt (offline?)».
