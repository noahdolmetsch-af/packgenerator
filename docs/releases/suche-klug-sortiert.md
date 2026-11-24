# Klügere Suche: Seiten zuerst, Material nur, wo es Sinn macht

Auftrag: Noah «1-5a» (24.11.2026) im Thread «Suche, Hilfe und Assistent zu einem vereinen», Stufe 1. Anlass: Material (zum Beispiel ein Trikot) stand vor den nützlichen Treffern.

## Was ist neu
- **Neue Reihenfolge:** Antwort der App, Befehle («Tun»), Passt zu deiner Frage, Seiten, Funktionen, dann Touren, Velos, Notizen, Tagebuch, Logbuch, Vorlagen, zuletzt Material (`ORDER` in `src/lib/suche/ordnung.js`; vorher stand Material immer zuerst).
- **Material zugeklappt:** eine Zeile «Material: 7 Teile ›», ein Tipp öffnet sie. Offen und vorn steht Material auf den Material-, Packen- und Sets-Seiten (aus der Adresse gelesen, `gearContext`), mit dem Knopf «Material» und bei Wörtern wie «Teil», «Gewicht», «Material». Gibt es sonst keinen Treffer, steht Material am Schluss offen.
- **Enter** öffnet nie ein Materialteil als Erstes, ausser im Material-Kontext oder mit dem Knopf «Material».
- **Filterknöpfe** unter dem Feld: Alles, Seiten, Touren, Velos, Notizen, Material. Die Wahl gilt nur für die offene Suche.
- **Themen** bei leerem Feld: sechs Kacheln (Packen, Touren, Velo, Körper, Wetter, App); ein Tipp zeigt ihre Seiten (aus den Reitern von `nav.js`). «Das suchen viele» bleibt darunter.
- Bei einer Frage steht kein «+ als neues Teil anlegen» mehr.
- **Starke und schwache Treffer** (Noah «1-4a»): ein Treffer im Namen ist stark; ein Treffer nur im Fliesstext ist schwach und steht unten unter «Weiter unten erwähnt». Nur starke Treffer klappen das Material zu.
- **Materialzeile mit Namen:** «Material · 3 Teile: Regenjacke, …».
- **Filterknöpfe mit Zahl:** Knöpfe ohne Treffer fehlen.
- **Die Suche lernt:** nach dreimal Material für dasselbe Wort steht Material dafür vorn; die Zeile sagt warum, «Vergessen» nimmt es zurück; nur auf diesem Gerät, nicht im Backup, abschaltbar unter Ich › Suche (`src/lib/suche/lernen.js`).

## Was fällt weg oder rutscht tiefer
- Material steht nicht mehr zuoberst in der Suche: es ist eine zugeklappte Zeile (ein Tipp tiefer) ausser an den Material-Orten.
- «+ als neues Teil anlegen» steht bei einer Frage nicht mehr; bei einem einfachen Wort bleibt es.
- «Meinst du … oder …» (Bedeutungen eines Worts) fällt weg; die Filterknöpfe mit Zahl ersetzen es (Noah «1-4a»).
- Bei einem Filterknopf ausser «Alles» fehlen Befehle und Antworten (nur die gewählte Art zeigt sich).

## Selbst entschieden
- Der Material-Kontext gilt für die Seiten von `#/gear`, `#/blocks`, `#/equipment`, die Packliste und die Reiter «Material» und «Sets» von «Velos und Material»; nicht für vergangene Touren und Vorlagen.
- Die Themen sind Kacheln mit einer Liste von Seiten, kein Suchwort: ein Suchwort wie «Körper» fand zu wenig Passendes.
- Die Wörter für «meine Sachen» (Teil, Gewicht, Material, Sachen, item, gear, weight) stehen in einer kurzen Liste (`GEAR_WORDS`).
- Ein Treffer, den nur ein ähnliches Wort fand («Jersey» bei «Trikot»), zählt als schwacher Treffer: er steht unten und versteckt dein Material nicht.
- Keine Datenänderung.

## Entscheide (eigene Datei)
- `docs/decisions/suche-klug-sortiert.md`
