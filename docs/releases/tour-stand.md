# Tour-Stand: wo eine Tour steht (Rechnung ohne Anzeige)

PR folgt · 07.11.2026 · Auftrag: Noah «1a» (Thread «Tour A–Z / Datencenter», Schritt 0, PR A)

## Was ist neu
- Eine reine Rechnung `src/lib/tourpfad/stand.js` (`tourStand`): sagt für eine Tour, in welcher der vier Phasen sie steht (Planen, Vorbereiten, Unterwegs, Danach) und wie weit jede Zeile ist (fertig, begonnen, offen, Hinweis, später). Dazu der «nächste Schritt» für den einen Hauptknopf.
- Die Phase kommt aus dem Datum und aus dem, was erledigt ist, wie `phase.js`. Was die Rechnung nicht aus der Tour lesen kann (Form, Velo-Pflege, Fahrt, Verpflegungsplan), kommt als Angabe hinein; fehlt sie, bleibt die Zeile offen («keine Daten» heisst nie «in Ordnung»).
- 19 Tests in `tests/tourstand.test.js`.
- Noch nichts zu sehen: der Tour-Pfad (Schritt 1) und die Karte «Meine Tour» (Schritt 2) lesen später dieses Ergebnis.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur neue Dateien, keine Seite, kein Text, kein Datenbank-Feld, kein Backup-Thema. Darum keine «Was ist neu»-Datei, keine Bilder, kein Eintrag in `features.js` und `app-stand.md`.
- Die Rechnung gibt Zahlen und Schlüssel zurück, keine Texte. Die Wörter kommen mit der Anzeige (Schritt 1).
- Zeilen, die der Entwurf nennt, aber heute keine Daten haben, fehlen noch: «Material zurück» (braucht ein neues Feld, kommt mit seinem eigenen PR), «Ankunfts-Bericht», Navigieren und Notizen unterwegs.
- «Körper und Tour» ist ein Hinweis und zählt nicht mit; so ist auch «Hauptknopf» nie ein Hinweis. Der Entwurf zeigt dort «2 von 4» bei fünf Zeilen; die Rechnung zählt die Zeilen ohne Hinweis ehrlich.
- Zeilen lassen sich später ausblenden (`hidden`), die Rechnung kann das schon.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Tour A–Z, Schritt 0 (Tour-Stand rechnen): gebaut. Danach: Seite «Meine Datenquellen» (PR B), dann Tour-Pfad.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts Sichtbares. Die App startet und Heute sieht aus wie vorher.
