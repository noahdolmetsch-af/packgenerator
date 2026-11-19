# Neue Ordnung der App: Wegweiser «alt → neu» und Streichliste

Entscheid: Noah 18.11.2026 «1a 2a 3b 4b 5b» (Thread «Ganze App neu denken: klickbarer Prototyp»). Der Plan steht in `docs/plan-ganze-app.md` (Schritte 9 bis 15, 2b, 4b, 6, 7a, 7b). Prototyp mit erfundenen Daten: https://claude.ai/artifact/8pjQB9ZWbsKxDaneViBekf (Computer zuerst, oben rechts «Handy»).

**Regel:** Keine Funktion fällt weg, nur weil ihr Ort wechselt. Jede alte Adresse (`#/care`, `#/review` …) führt weiter zum neuen Ort, mit einem kleinen Hinweis «Verschoben» (Schritt 9). Gestrichen wird nur, was in der Streichliste unten steht und was Noah dort entschieden hat. Dieses Blatt ist die Vorlage für jeden Bau-PR: er setzt seine Zeilen um und nennt sie in «Was fällt weg oder rutscht tiefer».

## Die acht Orte und ihre Frage

| Ort | Frage, die der Ort beantwortet | Reiter (neu) |
| --- | --- | --- |
| Heute | Was ist jetzt dran? | keine (Hauptkarte nach Lage, Heute abhaken, Woche, Körper, «Mehr für heute») |
| Planen | Was kommt diese Woche? | Woche · Notizen · Alltag |
| Touren | Wohin fahre ich, und bin ich bereit? | Übersicht · Träume · Vorlagen; die Tour selbst: Plan · Packen · Unterwegs · Danach |
| Aktiv | Wie bewege und erhole ich mich? | Heute · Training · Erholung · Sportarten |
| Auswerten | Wie ist es gelaufen? | Überblick (Fragen) · Körper · Fahrten · Wi gaht's · Eigenes Diagramm |
| Velos | Ist mein Velo bereit? | Übersicht · Pflege · Werkstatt · Teile und Setup |
| Material | Was habe ich, und was nehme ich mit? | Alle Teile · Kleider · Bausteine und Sets · Vorrat und Leihliste |
| Ich | Meine Daten, Verbindungen, Einstellungen | Übersicht · Daten und Backup · Verbindungen · Aussehen und Werte · Hilfe |

Heute 11 Orte in der Seitenleiste, neu 8; Reiter heute 52, neu 23 (Planen 12 → 3, Touren 7 → 3, Material 6 → 4, Velos 5 → 4, Aktiv 4 → 4, Auswerten 18 → 5). Gezählt aus `src/lib/nav.js`.

## Wegweiser: wo ist was geblieben

| Bisher | Neu |
| --- | --- |
| Heute: Meine Tour, Dein Moment, Tourkarte, Vorab | Heute › Hauptkarte |
| Heute: Quick Links (Ort und Kachel) | Heute › Abkürzungen, «Neu», Suche |
| Heute: Spruch, Entdecken, Gewichtsfrage, Balance, VO2max | Heute › Mehr für heute (aus, einschaltbar) |
| Heute-Check und «Wi gaht's» (4 Orte) | Gruss oben auf Heute; Verlauf: Auswerten › Wi gaht's |
| Planen: Woche, Woche planen, Ferien, Termine | Planen › Woche |
| Planen: Merken, Notizen, Tagebuch, Eingang | Planen › Notizen (Filter) |
| Planen: Alltag, Freie Zeit, Impulse | Planen › Alltag |
| Planen: Inspiration (eigener Ort) | Touren › Träume |
| Planen: Mail, Kompass, Werkzeuge und Links | Ich › Hilfe (Werkzeuge) |
| Touren: Übersicht, Träume, Vorlagen | Touren (3 Reiter) |
| Touren: Rückblick, Learnings, Tempo | Tour › Danach; alle Touren: Auswerten › Fahrten |
| Touren: Skitouren, Verpflegung, Reise-Links | Tour › Plan › «Mehr zu dieser Tour» |
| Touren: Werkzeugkasten | Ich › Hilfe |
| Neue Tour, Heute fahren, Vorlage, Traum | Touren › Neue Tour (eine Seite); «Heute fahren» bleibt Abkürzung |
| Aktiv: Heute, Training, Erholung, Sportarten | Aktiv (4 Reiter, gleich) |
| Aktiv: Meditation, Meilensteine, Trophäen | Aktiv › Sportarten |
| Training: Analysen über die Wochen | Auswerten › Eigenes Diagramm |
| Auswerten: Fragen, Überblick | Auswerten › Überblick |
| Auswerten: Form, Körperwerte, Erkenntnisse, Gewicht | Auswerten › Körper |
| Auswerten: Fahrten, Heatmap, Neuland, Gipfelbuch, Jahr, Gelernt | Auswerten › Fahrten (Reihe «Mehr») |
| Auswerten: Wi gaht's, Gut für mich, Impulse | Auswerten › Wi gaht's |
| Auswerten: Analyse (alle Werte) | Auswerten › Eigenes Diagramm |
| Velos: Ausrüstung (Reiter) und Mein Setup | Velos › Teile und Setup |
| Ausrüstung (eigener Ort) | Material › Bausteine und Sets |
| Material: Einkauf (Wunschliste), Vorrat, Leihliste | Material › Alle Teile (Filter) und Vorrat und Leihliste |
| Ich: Daten, Backup, Dokumente | Ich › Daten und Backup |
| Ich: Strava, Fitbit, Google | Ich › Verbindungen |
| Ich: Darstellung, Eigene Werte, Listen | Ich › Aussehen und Werte |
| Ich: Handbuch, Funktionen, Neu in der App | Ich › Hilfe |

## Streichliste: Noahs Entscheid (18.11.2026 «2a»: Empfehlungen übernommen)

Die Zahlen stammen aus Noahs Backup vom 17.11.2026 (Seiten, die im November geöffnet wurden, und leere Tabellen); kein Inhalt aus den Daten steht hier.

**Ganz weg (W):** W1 Kits (benannte Setups), 0 Einträge · W2 Timer-Protokoll (die Stoppuhr bleibt) · W3 Herkunft eines Gewichts · W4 Mini-Umfrage (Termin-Abstimmung). Vor dem Löschen eines Codes prüft der PR, ob Daten in der Tabelle liegen; die Tabelle selbst bleibt im Schema (keine Datenänderung, Regel 3).

**Hinter «Mehr» oder nur über die Suche (M):** M1 Spruch des Tages auf Heute · M2 Entdecken (2× auf Heute) · M3 Gewichtsfrage und Balance-Kachel auf Heute · M4 Kompass · M5 Reise-Links (werden Teil der Tour) · M6 Heatmap, Gipfelbuch, Gelernt (nach Auswerten › Fahrten › Mehr) · M7 Velo-Inspektion · M8 Werkzeugkasten (nach Ich › Hilfe).

**Zusammenlegen (Z):** Z1 Quick Links als Ort und Kachel · Z2 Ausrüstung als Ort (wird «Sets» in Material) · Z3 Inspiration als Ort (Teil von Touren › Träume) · Z4 Merken, Notizen, Eingang, Tagebuch zu einer Liste mit Filter · Z5 «Woche planen» an drei Orten zu einem · Z6 «Wi gaht's» an vier Orten zu einem · Z7 Rückblick an drei Orten zu einem · Z8 Auswerten 18 → 5 Reiter.

Jeder Punkt wird ein eigener kleiner PR (Schritt 14) oder Teil des Ort-PR, zu dem er gehört (Z1 bis Z3 in Schritt 10, Z4 und Z5 in Schritt 11, Z6 und Z8 in Schritt 12, Z7 in Schritt 4b); die PR-Beschreibung nennt die Nummer.

## Grenzen und Risiken

- Nur Oberfläche: keine Änderung an Dexie, Schema oder Backup-Format (Regel 3 gilt sonst).
- Wächter bleiben die Schranke: `tests/verlust.test.js` (Funktionsliste), `tests/appstand.test.js`, `tests/absprung.test.js`, `tests/plan.test.js`. Sie lesen die Reiter aus dem Code, nicht aus Kopien.
- Heute (2b) berührt `Home.svelte`; zuerst die Entscheide des Threads «Startseite ruhiger» (Noah 18.11.2026 «4b»).
- Neue Reiter-Namen bekommen ihre Zeile in `docs/namen.md` im PR, der sie einführt (ein Wort pro Sache).
