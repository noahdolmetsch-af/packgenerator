# Projektstand

Stand: 7. Oktober 2026

## Aktuell live

- **Entwürfe 2 und 3 veröffentlicht:** [PR #32](https://github.com/noahdolmetsch-af/packgenerator/pull/32) ist zusammengeführt, Merge `be041f1`; Build, 12 Browser-Tests und Deployment erfolgreich. Entscheidungsentwurf mit Bestätigung/Abbruch und Übergang zum Packtag im isolierten Browser-Test geprüft; neue Packliste, Review-Leerzustand und Rückweg auf Live geöffnet. Paketversion weiterhin 0.22.0. [Releasebeleg](releases/2026-10-07-calm-preparation.md), [Screenablauf](calm-preparation.md), [Design-QA](../design-qa.md).
- **PR #30 / M1 implementiert:** AP03–AP06 sind ausgeliefert und in #32 erhalten. Vollständige formale AP-/Meilensteinabnahme und Zeitmessungen sind offen. 227 Unit-Tests bestanden; [Prüfregister](verification.md) trennt Teilnachweise von Gesamtabnahme.
- **Eine aktive Roadmap:** [AP01–AP26](roadmap.md), mit stabilen IDs, Abhängigkeiten und Kriterien. [Dokumentationsindex](README.md) ordnet alle Quellen ein.

## Offen zur Integration / Abnahme

- **PR #31, angekündigt v0.22.1:** Eventmodus nur für Events, relative Fälligkeitstexte, „Weitere Dinge“, Gear-Breite und „Leichtestes“ nur bei vollständigen Taschengewichten. Offen und nicht Bestandteil des Live-Stands. Der Branch wurde während dieses Abgleichs aktualisiert: `05a7f84` integriert PR #32 samt Event-Schalter, CI 37667778399 erfolgreich. Gemeinsame Dokumentation wird im Branch nachgeführt. AP04/AP06/AP16/AP21; fachliche Releaseabnahme und Veröffentlichung bleiben offen.
- Beide neuen Screens mit den fünf Alltagsszenarien fachlich abnehmen. 60-/30-Sekunden-Ziele sind ungemessen.
- AP01/AP02 abschliessen; Kontext/Übernachtung, Mengen-/Wasser-/Bestandskonflikte, Materialpflege/Kategorieänderung, Bausteine und 320-px-/Screenreaderprüfung bleiben offen. Ausführliche Teilstände in der Roadmap.

## Historie veröffentlichter Funktionen

Die folgenden Einträge beschreiben den jeweiligen damaligen Release. Spätere Entscheidungen haben einzelne Layouts, Navigation und Bezeichnungen ersetzt. Für das heutige Verhalten gelten die Abschnitte oben und das Entscheidungslog.

- **Optimierung M1: Sofortige Klarheit (v0.22.0)** — neues Projekt „Optimierung vom Packgenerator“ (aktuelle Quelle: [Roadmap AP01–AP26](roadmap.md)):
  - **Ruhigere Schrift und Farben (AP03):** Inhalte in Fira Sans (Titel 30–40 px, Text 16 px), keine Grossbuchstaben mehr, dünnere Rahmen, Aktionsorange #b83e08 (Kontrast 5.6:1 statt 3.1:1), nur die aktuelle Hauptaktion ist orange, sichtbarer Fokusrahmen.
  - **Ehrliche Gewichte und klare Wörter (AP04):** Summen heissen „bekannt: …“ und zeigen daneben, wie viele Gewichte fehlen; Front/Heck ist bei Lücken eine Schätzung; Velogewicht gemessen oder geschätzt. „Not packed“ heisst „Weitere Materialien“; gepackt / noch einzupacken und Startcheck geprüft / offen getrennt gezählt. Packzeilen haben wieder ein sichtbares „•••“ statt Knöpfen nur beim Darüberfahren.
  - **Favoriten (AP05):** Stern vor jedem Teil, ein Tipp genügt; der Favoriten-Link öffnet Ausrüstung gefiltert; eine Zählbasis (Inventar + Wunschliste getrennt).
  - **Bereitschaft einheitlich (AP06):** Startseite, Pack und Velos → Pflege zeigen dasselbe, getrennt nach Velopflege, Eventvorbereitung und Packstand. Ursache des alten Widerspruchs: die Startseite liess zeitfällige Services (Dichtmilch, Gabel) weg. „alles gut“ ist weg; ohne Daten steht „keine Daten“.
- **Echt benutzen, vereinfachen, Reisearten (v0.21.0):**
  - **Startseite "Still open":** was noch fehlt, damit die App für dich rechnen kann (Velos wägen, GPX laden, Inventar prüfen, Favoriten anwenden, erste echte Tour). Backup-Hinweis auch nach jedem neuen Rückblick. "Your data" zeigt, aus welchem Backup die Daten stammen (Phone ist das Hauptgerät, der Desktop holt den Stand per Backup-Datei).
  - **Velos und Velopflege auf einer Seite:** Velos mit den Tabs Setup | Pflege. Pflege zeigt oben "Jetzt fällig" für alle Velos, dann die nächste Tour; jedes Velo ist eine zugeklappte Zeile. Die Excel-Vorbereitung ist eine Zeile "Vorbereitung: n offen". Pflege von 159 auf 13 Bedienelemente, Setup am Phone von 5.9 auf 2.1 Bildschirme. Die alte Adresse #/care führt auf den Tab Pflege.
  - **Pack ruhiger:** ein Menü "•••" für Tourwahl und seltene Aktionen, vier Gewichte (System, Basis, Am Körper, Essen und Wasser), der Rest unter "Mehr". "Vor der Tour", "Fahrt und Wetter" und "Nacht" zugeklappt mit einer Zeile Zusammenfassung. Knöpfe pro Teil erscheinen am Desktop beim Darüberfahren, am Phone nach Antippen. Hinweis bei schweren Teilen (über 500 g) in Lenker-, Seiten- oder Satteltasche. Desktop von 296 auf 48 Bedienelemente.
  - **Reisearten (Paket 5):** neben Bikepacking auch Skitour (Rucksack 30 L), Wochenende (Reisetasche + Tagesrucksack) und Weltreise (Rucksack 60 L + Tagesrucksack), jeweils mit "Am Körper". Neue Tour fragt zuerst die Reiseart; ohne Velo keine Zeichnung, kein Fahrtag (Packliste → Packtag → Rückblick). Ein Inventar: Teile können zu mehreren Reisearten gehören (Gear → Teil bearbeiten), Filter nach Reiseart in Gear, sobald es mehr als eine gibt. Neue Seite "All my favourite things" (alle ★, nach Reiseart, druckbar).
  - **Automatischer Test der ganzen Runde:** bei jedem Pull Request im Browser (Phone und Desktop, Deutsch und Englisch): Daten laden → neue Tour → packen → Packtag → Fahrtag → Rückblick, dazu eine Wochenend-Tour. Er hat schon 2 Fehler in Pack gefunden (Dialog öffnete vor den Velos, Knopfreihe zu breit) und einen in Gear (ohne Schrift offline zu breit am Phone).
- **Grosser Knopf „Weiter“ (v0.20.2):** Pack zeigt oben die vier Schritte der Tour (Packliste, Packtag, Fahrtag, Rückblick) und einen grossen orangen Knopf zum nächsten: Packtag, solange nicht alles gepackt und der Startcheck nicht fertig ist; dann Fahrtag; nach der Tour Rückblick. Der Fahrtag hat am letzten Tag oben „Weiter: Tour beenden und Rückblick“.
- **Ganze Runde durchspielbar (v0.20.1):** „Neu → Packliste“ öffnete keine neue Tour, solange noch keine Vorlage gespeichert war; behoben. Fahrtag hat unten „Tour beenden und Rückblick“: Die Tour gilt sofort als beendet (nicht erst am Tag danach) und der Rückblick öffnet. Pack zeigt ab dem Starttag einen Knopf „Rückblick“. Runde: Neu → Packliste → Tour erstellen → packen → Fahrtag → Tour beenden → Rückblick.
- **Deutsch und Englisch (v0.20.0):** Oben in der Leiste DE | EN, auf jeder Seite. Die Wahl gilt pro Gerät (Phone und Desktop getrennt) und bleibt gespeichert; Englisch ist Standard. Alle Knöpfe, Titel, Hinweise, Fehlermeldungen, Daten und Zahlen (1’460, 15. Okt.) wechseln mit, Gear-Teile zeigen ihren deutschen Namen aus der Excel. Was du selbst geschrieben hast (Tour- und Taschennamen, Learnings, Notizen, Aufgaben aus der Excel, Logbuch) bleibt, wie es ist. Schweizer Schreibweise (ss statt ß, Velo).
- **Neue Startseite und Navigation (v0.19.6):** Oben die nächste Tour als dunkles Band (Countdown, Continue packing, Ride day, Print, „Before the trip“). Darunter Pack, Gear und Bikes gleich gross: Pack mit „New packing list“ (Template, letzte Tour kopieren oder Standard-Set), Packstand, Ballast und Listen zum Öffnen; Gear mit Favoriten, wo das Gewicht steckt, schwerstem Teil, Wunschliste und Wäge-Fortschritt; Bikes mit km, Status pro Velo und Werkstattkosten des Jahres. „Good to know“: Wetter und Sonnenzeiten, ein Learning, dein Tempo, Inbox, Backup. Obere Leiste auf jeder Seite: Home, Gear, Pack, Bikes, Debrief, Suche über alles, Inbox mit Zahl und „New“ (Packliste, Gear-Teil, Quick note, km, Werkstatt-Beleg, Template). Am Phone die Bereiche unten mit dem + in der Mitte; der schwebende +-Knopf ist weg.
- **Packen und Fahren (v0.19.5):** Pack zeigt oben die Karte "Ballast": was auf dieser Tour ist, aber die letzten 2 oder 3 Male nicht gebraucht wurde, mit Gramm, "Leave at home" (einzeln oder alle, Undo geht) und "Keep" (bleibt dabei, die Karte fragt nicht mehr). Statt des Learning-Satzes stehen kurze Marken beim Item ("3× not used", "Missed last time", "Broke last time", "Tip"); antippen zeigt den Satz, auch am Packtag. Ride day hat "Block by block" für jede Tour, nicht nur nonstop: pro 3-Stunden-Block was du anziehst und ausziehst (mit Tasche), wie viel essen und trinken, wo nachfüllen, und ab wann Licht (Sonnenuntergang offline berechnet).
- **Favoriten als Datengrundlage (v0.19.4):** Noahs Liste "favorites-tested-bikepacking-gear" kommt als private Datei über Startseite → Your data → Import backup → "Apply favourites". Jedes Lieblingsteil bekommt einen ★ (Gear, Pack), Gear hat den Knopf "★ Favourites", in Pack stehen Favoriten oben in "Not packed", und die Liste ist als Template gespeichert. Gewichte und alles andere bleiben; nichts wird gelöscht. Im Item-Dialog lässt sich der Stern ein- und ausschalten.
- **Werkstatt und Quick note (v0.19.3):** Bike care → "Workshop order": alles, was bis zur nächsten Tour fällig ist, als ein Auftrag mit Preisen aus deinen Quittungen; abwählen, was du selbst machst; als Nachricht (Deutsch) senden oder drucken. Bikes zeigt einen Steckbrief pro Velo (km, Werkstatt dieses Jahr, pro 1000 km, was als Nächstes fällig ist, letzter Besuch). Pack → "Compare bikes": die Velos nebeneinander für die Tour, "Use for this trip" wechselt das Velo. Quick note: runder +-Knopf auf jeder Seite, Foto optional, Seite "Inbox" zum Einordnen (Reparatur, Wunschliste, Learning, Notiz zur Tour, erledigt), alle Notizen bleiben unter "All notes". Am Phone: langes Drücken aufs App-Icon → "New note", und Pack Generator erscheint beim Teilen von Text und Links.
- **Auswerten (v0.19.2):** Debrief → "Your trips compared": Gepäck pro Tour, gebraucht und nicht gebraucht, mit Trend. Gear → Tab "Dead weight": mitgenommen, aber nie gebraucht, mit "Leave at home"; dazu "Rarely used". Wunschliste mit Grund (fehlte, kaputt, Velo) und nach Nutzen sortiert. Notizen vom Ride day werden im Debrief als Learning vorgeschlagen. In Pack lässt sich eine Tour als "Not riding" markieren: Sie bleibt, zählt aber nicht mehr als nächste Tour.
- **App lernt (v0.19.0):** Debrief → "Your pace": GPX-Fahrten laden, die App rechnet dein Tempo (aus 8 Fahrten: 28.5 km/h plus 1 h pro 1070 m, Pausen +34 %). Pack und Ride day schätzen die Fahrzeit damit, der Ride day zeigt auch die Ankunft mit deinen üblichen Pausen. Nach 3 Debriefs schlagen die Templates vor, was raus kann (3× nicht gebraucht) und was rein soll (2× gefehlt). Neue Demo-Datei `private/demo/pack-generator-demo-app-lernt.json` (303, Hope 1000, Alpenbrevet).
- **Eine Liste "Before the trip" (v0.18.2):** Startseite, Pack und Bike care zeigen dieselbe Liste mit derselben Zahl: Vorbereitungs-Aufgaben mit Datum, was das Velo braucht (Werkstatt ab 14 Tagen vorher, Fälliges immer) und offene Reparaturen dieses Velos. Überfälliges zuerst und rot. In Bike care stehen die Aufgaben der Tour jetzt alle im Abschnitt der Tour, nicht mehr verteilt auf "Due now".
- **Probefahrt 303 (v0.18.1):** Die Lucerne 303 als Demo durchgespielt (14 Tage vorher, Packtag, Start, Nacht, Debrief). Daraus: Packtag warnt, wenn die Vorhersage kälter oder nasser ist als gepackt, und springt zu den passenden Layers; Debrief zeigt deine Notizen vom Tourtag und schlägt bei "fehlte" ähnliche Teile aus deinem Gear vor; Packtag am Phone ohne Querscrollen; Demo-Tag lässt sich mehrmals hintereinander wechseln. Demo-Datei: `private/demo/pack-generator-demo-lucerne-303.json` im Projektordner.
- **Tagesansicht, Werkstatt-Erinnerung, Demo-Modus (v0.18.0):** Pack → "Ride day": alle Taschen mit Inhalt, Etappe mit km, Höhenmetern, Fahrzeit, Ankunft und Höhenprofil, Wetter Stunde für Stunde am Start und am Ziel (bleibt offline sichtbar), Notizen für den Debrief. Mehrtägige Touren: Tag für Tag; Nonstop: eine Etappe über Nacht mit deinen Blöcken. Am Tourtag öffnet die Startseite die Tagesansicht. Pack und Bike care zeigen ab 14 Tagen vor einer Tour, was die Werkstatt noch machen muss. Demo-Dateien starten einen Demo-Modus, "End demo" setzt alles zurück.
- Grundgerüst: Svelte + Vite, installierbar (PWA), funktioniert offline, online auf GitHub Pages.
- Bike-Cockpit-Prototyp: seit 4.10.2026 archiviert in `archive/cockpit/`, nicht mehr online.
- Datenbank (IndexedDB/Dexie) mit Datenmodell für Gear, Kits, Trips, Debriefs, Learnings, Events, Wartung, Bikes.
- "Your data" auf der Startseite: Anzahl Datensätze, Export, Import (ersetzen oder zusammenführen), automatische Ordner-Sicherung am Desktop.
- Excel-Konverter (`tools/import-excel/`); deine Excel ist umgewandelt in `data/pack-generator-import.json` im Projektordner.
- **Gear-Seite (Ledger):** Kennzahlen, Gewicht nach Kategorie (Balken, antippen filtert), 10 schwerste Teile, Suche und Filter, Liste nach Kategorie, Wunschliste getrennt, Teil bearbeiten, hinzufügen, löschen.
- **To weigh (Waage-Modus):** ein Teil nach dem anderen, Gramm eintippen, "Save and next" oder "Skip". Am Phone als Tab, am Desktop über "Weigh missing items".
- Am Phone ist Gear zum Nachschlagen und Wägen da (Details ansehen, Gewicht eintragen).
- Gear-Korrekturen nach dem ersten Rundgang: Kategorien auf- und zuklappbar, Gear-Gewicht ohne Essen und Wasser, Brand und Model getrennt, Wägen beginnt mit Teilen für jede Tour, Phone-Layout verbessert.

- **Bikes:** eigene Taschenliste, 4 Velo-Setups mit Velo-Zeichnung, Montagepunkte ein/aus, Velo- und Fahrergewicht.
- **Pack:** Tour wählen oder neu (Kopie der letzten Tour mit demselben Velo, sonst Standard-Set), Tasche auf der Zeichnung wählen, Teile hinzufügen, verschieben, Anzahl, abhaken (am Phone Tasche für Tasche), Taschen pro Tour ändern, Ready-Check (Standardliste, pro Tour änderbar), Systemgewicht.

- **Werkstatt und Setup-Fotos (v0.17.0):** Bike care zeigt pro Velo die Werkstatt-Besuche (Betrag, Arbeiten, Beleg-Fotos zum Vergrössern, km nachtragen), "Coming up" (Gabel- und Dämpfer-Service jährlich, Dichtmilch alle 3 Monate), Schlauch oder tubeless pro Rad, Kosten pro Jahr und pro 1000 km. Neue Teile: Bremsen, Laufräder, Hinterbau, Cockpit. Bikes zeigt eine Foto-Galerie pro Velo (antippen, wischen, "Show in Pack", einer Tour zuordnen). Pack zeigt das Foto blass hinter den Taschen, mit Knopf zum Vergrössern.
- **Logbuch, Fahrten-Import, Teilen (v0.16.0):** Debrief zeigt die 12 alten Touren als Logbuch. Im Debrief lassen sich Fahrten aus Strava oder Garmin als Datei importieren (km werden zusammengezählt). Pack → "Share link" kopiert einen Link zur Packliste (nur lesen), "Print / PDF" speichert sie als PDF.
- **Wetter, Route und Velo-Foto (v0.15.0):** In Pack unter "Ride and weather" eine GPX-Route laden (Distanz, Höhenmeter, geschätzte Fahrstunden), Startort suchen, Wettervorhersage pro Tourtag von Open-Meteo, ein Klick packt für diese Vorhersage. Offline bleibt die letzte Vorhersage sichtbar. Startseite zeigt die Vorhersage. Bikes → Edit → Foto deines Velos; es erscheint in Pack hinter den Taschen.
- **Packtag und Debrief-Lernen (v0.14.0):** Pack → "Packing day" im Vollbild, Tasche für Tasche mit grosser Schrift, antippen = in der Tasche, am Schluss der Ready check; der Bildschirm bleibt an. Learnings stehen als kleiner Hinweis beim passenden Item. Debrief fragt nach den km der Tour und zählt sie zum Velo. "Leave at home" erst nach 3× nicht gebraucht. Startseite erinnert ans Backup, wenn das letzte älter als 14 Tage ist.
- **Debrief und Startseite (v0.13.0):** Debrief in 3 Schritten (Wie war's, Items durchgehen, Zusammenfassung mit Vorschlägen für Gear, Learnings und Template), alle Learnings durchsuchbar. Startseite zeigt die nächste Tour mit Countdown, Packstand, Ready check, Wartung vor der Tour, Learnings, Velos und Gear. Dazu alle Vorschläge aus dem Design-Audit auf Gear, Pack, Templates, Bikes und Bike care.
- **Pack mit grossen Taschen-Kästen (v0.12.0):** Taschen zeigen Inhalt direkt auf dem Velo, ruhiger Kopf, Layers gruppiert, Ready check zugeklappt, am Phone Taschen als Streifen. Alle Taschen als Liste mit "Move", Zweck-Namen, Vorlagen als Knöpfe, Undo, ruhigere Farben.
- **Design-Runde 1 und Template-Editor (v0.11.0):** Gewichte in einer Zeile, Wetter klappt zu, Kacheln ziehen, kurze Namen in der Zeichnung, Templates direkt bearbeiten.
- **Templates (v0.10.0):** Setup speichern, aktualisieren, neue Tour daraus; Seite Pack → Templates; Kacheln mit "−" statt Häkchen.
- **Ready-Check aufgeräumt (v0.9.0):** eine kurze Liste, "Tick all checks", "Save as my standard"; "Always with me" sind jetzt Teile "On every trip". Prototyp archiviert.
- **Neues Pack-Layout (v0.8.0):** drei Spalten, "Not packed" nach Kategorie zugeklappt, Etiketten, "+" oder Ziehen auf eine Tasche, Kacheln mit Füllbalken, Ready-Check kurz, am Phone fixe Leiste "Adding to".
- **Runde 3 (Antworten 1–10):** 4 echte Velos mit Setups, fixe Halterungen, Nacht-Sets inkl. Light, Wetter mit Kleider-Vorschlag, Volumen-Warnung mit Taschen-Vorschlag, Wägen aus Pack, Druckliste, Gepäck vorne/hinten, Inventar-Check.

## Nutzungs- und Datenaufgaben für Noah

Aus bisherigen Aufgaben übernommen, in dieser Runde nicht neu geprüft. Keine Softwareabnahme daraus ableiten.
- [ ] Nächste echte Fahrt (Arbeitsweg) am Phone durchspielen bis zum Rückblick.
- [ ] GPX-Fahrten laden (Rückblick → Your pace).
- [ ] Skitour-Ausrüstung als Liste schicken.
- [ ] Favoriten-Datei am Phone und am Desktop laden (Your data → Import backup → Apply favourites).
- [ ] **Inventar durchgehen:** Gear → "Check inventory" (am Phone Tab "Check"). Pro Teil: Still have it / Gone / Replaced by… / fehlende Teile mit "Add item" ergänzen.
- [ ] Scott Scale, Scott Spark und Factor LS wägen (ohne Taschen, mit Garmin-, Quad-Lock- und Flaschenhalterungen) und auf "Bikes" eintragen. Canyon ist erledigt (10.1 kg).
- [ ] Neue Teile wägen: "Trainerhose lang chillig" und "Gilet Fleece kuschelig".
- [x] Import-Datei "Werkstatt und Fotos" am Handy mit Merge importiert.
- [ ] Am Desktop die Import-Datei nochmals mit Merge laden (Besuch Veloshop Vonäsch).
- [ ] Belege für das Canyon schicken, falls es welche gibt.
- [ ] Bike care → "Go through them": die 17 Juni-Aufgaben einmal durchgehen.
- [ ] Full-Frame-Tasche wägen (neu in Gear, TA14).
- [ ] Danach die 303 in Pack neu packen (Taschen für diese Tour prüfen).
- [ ] App auf dem Samsung A56 installieren (Anleitung im Chat).
- [ ] Für die 303 den Startort und die GPX-Route in Pack eintragen.
- [ ] Regelmässiges aktuelles Backup sichern (Startseite → Download backup); ältere „erstes Backup“-Aufgabe nicht als aktuellen Datenstand verstehen.

## Nächste Schritte

1. Neue Entscheidung/Packliste im Alltag abnehmen (AP13–15/AP19/AP21/AP23).
2. Grundlagen- und Restore-Nachweise AP01/AP02 vervollständigen.
3. Integrierten PR #31 nach Dokumentabgleich fachlich mit Event/Kurzfahrt abnehmen; Veröffentlichung separat.
4. AP07–AP09 und AP12–AP16 entlang der Roadmap-Abhängigkeiten abschliessen; danach AP10–AP11/AP17–AP24.
5. Erklärbares Lernen und Geräte-Sync separat als AP25/AP26. Erste echte Arbeitsweg-Tour liefert dafür Nutzungsbelege.

Der frühere Plan „Ist-Analyse und Plan“, Etappen A–D und offene ★-Annahmen sind historische Quellen. Sie sind keine gleichzeitig laufende Roadmap. Bereits umgesetzte Reisearten und Funktionen bleiben; ungelöste Anforderungen werden mit AP-ID in die aktuelle Roadmap aufgenommen.
