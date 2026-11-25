# Hilfe-Karte nach dem Titel

PR #<Nummer> · 08.11.2026 · Auftrag: Noah «A, Hilfe-Karte nach dem Titel» und «1-5 a» (UX-Test Impeccable, Befunde 1-01 und 2b-01), Thread «Hilfe-Karte nach dem Titel setzen»

## Was ist neu
- Die Karte «Was du hier tun kannst» steht auf allen 132 Seiten, die sie zeigen (`ON_PAGES`), **hinter dem Seitentitel** (samt Untertitel oder Knopfzeile) und nicht mehr davor. Der Titel ist wieder das Erste, was man sieht.
- Sie startet überall als **eine Zeile** («Was du hier tun kannst · Aufklappen»). Vorher startete sie nur auf Unterwegs, Packen, Velos, Material, Training, Auswerten, Touren, Ski, den Einstellungsseiten und dem Timer so. `FOLDED_FIRST` ist jetzt `ON_PAGES`.
- Wer eine Karte schon geöffnet (oder eingeklappt) hat, behält seine Wahl pro Seite.
- Aussehen › Karten auf den Seiten: zählt jetzt die Seiten mit **offener** Karte und klappt sie mit «Alle Karten wieder einklappen» zu (mit Rückgängig). Das ersetzt «Alle Karten wieder aufklappen», das bei lauter eingeklappten Karten nichts mehr täte.
- Technik: `src/lib/ui/nachtitel.js` setzt den Behälter der Karte hinter den ersten sichtbaren `h1` der Seite und hält ihn dort, wenn die Seite neu zeichnet. Hat eine Seite keinen `h1`, bleibt die Karte oben wie bisher. Bis die Karte ihren Platz hat, ist sie unsichtbar (kein Springen).

## Was fällt weg oder rutscht tiefer
- Die ausgeklappte Karte oben auf rund 60 Seiten (Notizen, Woche, Merken, Tagebuch, Eingang, Assistent, Neuland, Wetter …): sie ist jetzt eine Zeile hinter dem Titel, ein Tipp klappt sie auf. Inhalt entfällt nicht.
- «Alle Karten wieder aufklappen» (Aussehen) → «Alle Karten wieder einklappen».

## Selbst entschieden
- «Gehört zu» und «Soll ich dich erinnern?» bleiben vor der Seite, weil der Auftrag nur die Hilfe-Karte nennt (UX-Test 1-01 schlägt «Gehört zu» auch tiefer vor: eigener PR, falls gewünscht).
- Die Zeile steht bei Titeln mit Untertitel hinter dem Untertitel (ein kurzer Absatz direkt nach dem Titel), damit Titel und Satz zusammenbleiben.
- Seiten ohne `h1` (z. B. Feierseiten) zeigen die Karte nach kurzer Wartezeit oben.

## Entscheide (für decisions.md)
- 08.11.2026: Die Hilfe-Karte startet auf jeder Seite als Zeile hinter dem Titel (Noah «1a» zum UX-Test, «A»).

## Stand im Plan (roadmap.md / vorhaben.md)
- UX-Test 08.11.2026, Muster «Hilfe-Karte vor dem Titel»: erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Notizen öffnen: zuerst der Titel «Notizen», dahinter die Zeile «Was du hier tun kannst». Darauf tippen: die Karte geht auf.
2. Ein paar andere Seiten ansehen (Woche, Tagebuch, Eingang, Assistent): überall Titel zuerst, dann die Zeile.
3. Ich › Aussehen › Karten auf den Seiten: «Alle Karten wieder einklappen» tippen, dann «Rückgängig».
