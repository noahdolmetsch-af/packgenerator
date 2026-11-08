# Flyer für deine Tennisstunden

PR folgt · 07.11.2026 · Auftrag: Noah «ok Flyer», «modular ja» (Thread «Klären Flyer für Tennisstunden»), Teile B bis D in einem PR

## Was ist neu
- Neuer Tab «Flyer» im Bereich «Tennis» (`#/me/tennis/flyer`) und der Knopf «Flyer erstellen» am Angebot (`#/me/tennis/flyer?o=<id>`).
- Der Flyer besteht aus Bausteinen: Kopfzeile, Foto mit Abzeichen, Titel und Untertitel, Tabelle (Wann, Uhrzeit, Wo, Dauer, jede Zeile einzeln), Stufen, Infokarten (Besammlung, Abholung, Kosten, Regenregel, Mitbringen, eigene Karten), Trainer, Anmeldeschluss und freie Plätze, Anmeldeband mit QR-Code, eigene Texte. Jeder Baustein hat einen Schalter, die mittleren lassen sich mit Pfeilen und per Ziehen verschieben.
- Texte kommen aus dem Angebot (Tag und Zeit aus dem nächsten Termin, Ort, Preis, Zeitraum) und lassen sich überschreiben, je Sprache.
- Art: Gruppenunterricht, Schnupperstunde, Ferienkurs, Einzelstunden (gleiche Vorlage, andere Starttexte und Bausteine).
- Stufen: eine Zeile pro Stufe (aus einem Angebot oder von Hand) oder «Ein Flyer pro Stufe» mit eigenem QR-Code zum Angebot der Stufe.
- Drei Formate (16:9, A4 hoch, Quadrat), Deutsch und Englisch; das Bild entsteht auf dem Gerät (Canvas), der QR-Code führt zur Anmeldeseite des Angebots.
- Foto tauschen: Galerie oder Kamera am Handy, Datei am Computer, bis zu sechs Fotos, Ausschnitt per Ziehen und Regler. Die Fotos bleiben auf dem Gerät.
- Speichern (alle Bilder), Teilen (Teilen-Menü des Handys), «E-Mail vorbereiten» (Kunden mit E-Mail-Adresse in Bcc, die App sendet nichts), «Link kopieren».
- Vorlagen: Bausteine und Texte als Vorlage speichern, umbenennen, löschen (mit Rückgängig).

## Was fällt weg oder rutscht tiefer
- nichts. Der Tab «Flyer» ist zusätzlich; «Flyer erstellen» steht neu zusätzlich neben «Link kopieren» am Angebot.

## Selbst entschieden
- Die Fotos liegen unter dem Geräte-Schlüssel `tennis.flyerPhoto` (`DEVICE_SETTINGS`): nicht im Backup und nicht im Abgleich. Bausteine und Texte (`tennis.flyers`) sind normale Einstellungen und reisen mit. Keine Schema-Änderung.
- Kopfzeile, Foto und Anmeldeband behalten ihren Platz (oben, unter der Kopfzeile, unten); die anderen Bausteine lassen sich verschieben. So bleibt der Flyer immer lesbar.
- Passt der Inhalt nicht, wird alles bis auf 40 % kleiner; ist er kurz, wird er etwas grösser.
- Besammlung, Abholung, Regenregel und Mitbringen stehen leer da (nichts Erfundenes); eine Karte erscheint erst mit Text. «Kosten» kommt vom Preis der Stufen.
- Eigene Texte und eigene Karten gelten in allen Sprachen so, wie sie geschrieben sind.
- Nicht in diesem PR (kommen einzeln): Bestätigungs-Mail und Teilnehmerliste mit Warteliste.
- Keine Karte «Gut zu wissen» (die Seite steht nicht in `ON_PAGES`); Fertig-Regel sonst: Eintrag im Katalog, Absprung vom Angebot, leerer Zustand, «Als Nächstes», Zeile in `docs/app-stand.md`.

## Entscheide (für decisions.md)
- 07.11.2026: Flyer in einem PR statt B bis G einzeln (Noah «flyer in 1 PR», «ok Flyer»); Inhalt in Bausteinen (Noah «modular ja»); Fotos aus Galerie oder Datei austauschbar.

## Stand im Plan (roadmap.md / vorhaben.md)
- Flyer für Tennisstunden: B bis D online mit diesem PR; offen: Anmeldeseite mit QR (steht schon, der Link führt auf die bestehende Buchungsseite), Bestätigungs-Mail, Teilnehmerliste.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Tennis» öffnen, Tab «Flyer»: die Vorschau zeigt dein Angebot mit QR-Code.
2. «Infokarten» ausschalten und wieder einschalten, «Tabelle» einen Platz nach unten schieben: die Vorschau folgt.
3. Unter «Foto» ein Bild aus der Galerie wählen: es erscheint im Flyer. «Bilder speichern» antippen: die Bilder landen in den Downloads.
4. «Teilen» (am Handy) oder «E-Mail vorbereiten»: die Mail hat den Anmeldelink, die Kunden stehen in Bcc.
