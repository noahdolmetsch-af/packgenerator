# 2. Umgesetzt und live (0.97.0 bis 0.131.2)

Stand 14.10.2026. Zurück zur [Übersicht](README.md).

Alles hier ist auf `main` und auf GitHub Pages online. Die Texte folgen der Rubrik «Was ist neu» in der App (`src/lib/whatsnew.js`). Fehlende Nummern (0.112, 0.113, 0.120, 0.125 bis 0.130) sind keine verlorenen Releases: Sie wurden beim Umnummerieren paralleler Pull Requests übersprungen oder sind für Pakete reserviert, die noch nicht live sind ([Dokument 3](03-in-arbeit.md)).

## Auf einen Blick

| Thema | Versionen | Kurz |
|---|---|---|
| Design-Refresh, alle Seiten neu | 0.97.0 bis 0.110.0 | Neuer Look, Seite für Seite umgebaut |
| Touren planen und packen | 0.111.0, 0.114.0, 0.119.0, 0.124.0 | Vorabend-Check, Rahmenbedingungen, Schnellstart, Bausteine zum Antippen |
| Velo | 0.115.0, 0.116.2, 0.117.0, 0.122.0, 0.131.2 | Menüs, Werte erfassen, Knöpfe mit Erklärung, Velo-Reihenfolge |
| Strava | 0.116.0, 0.121.0 | Verbindung, Fahrten mit Velo, zählen bei Woche und Monat |
| Aktiv und Motivation | 0.102.0, 0.107.0, 0.123.0, 0.131.1 | Challenges, Aktiv neu, Trophäen-Vitrine, Abhaken-Fix |
| Was ist neu, Hilfe | 0.110.0, 0.118.0 | Alle Funktionen mit Suche, «Was ist neu» neu erzählt, KI-Helfer ab Werk aus |
| Fehler und Aufräumen | 0.116.1, 0.131.0 | Alte Rückblicke öffnen wieder, Daten einmal bereinigt |

## Design-Refresh (12.10.2026)

Auslöser: Noah wollte jede Seite neu gezeichnet und gab den Umbau am 12.10. «allem anderen vorgezogen» frei. Geplant waren 24 kleine Releases in 5 Wellen; Noah bündelte sie zu 10 Paketen (P1 bis P10), eines pro Bereich.

| Version | Titel | Was neu ist |
|---|---|---|
| 0.97.0 | Salbei und Inter ziehen ein | Farbwelt «Salbei» und Schrift Inter. Unter Ich › Darstellung: 8 Schriften, Farbwelt, Schriftgrösse, hell oder dunkel. Die alten Farbwelten bleiben wählbar. |
| 0.98.0 | Oben hell, seitlich hell | Helle Kopf- und Seitenleiste. Am Handy sitzt «Neu» (+) oben neben der Suche; am Computer zeigt die Seitenleiste die Unterseiten eines Orts, «Ich» ganz unten. |
| 0.99.0 | Weiche Ecken, Konfetti inklusive | Einheitliche Knöpfe und Felder mit weichen Ecken; leere Seiten mit Bild und nächstem Schritt; kurzer Konfetti-Moment, wenn alles gepackt ist; ruhige «Rückgängig»-Hinweise. |
| 0.100.0 | Schritt für Schritt | Eine Tour hat vier nummerierte Schritte; die Leiste unten zeigt «Schritt 1 von 4» und den Hauptknopf. |
| 0.101.0 | Heute, hell und ruhig | Tour-Karte mit Stunden bis zum Start und Packstand; neue Kacheln: Diese Woche, Velo im Monat, Nächster Meilenstein, Vor einem Jahr. |
| 0.102.0 | Baden oder Sauna? | Kachel «Heute baden oder Sauna?» mit eigenen Alternativen. Jeder Vorschlag kann eine Challenge werden, die von selbst zählt und als Meilenstein gefeiert wird. |
| 0.103.0 | Material, Liste zuerst | Material zeigt zuerst die Liste; Sortieren, Filtern, Zuordnen und Wiegen als helle Karten. |
| 0.104.0 | Touren mit Aussicht | «Weitermachen» oben; Strecke auf kleiner Karte mit Höhenprofil und Etappen. |
| 0.105.0 | Velos, frisch poliert | Zeichnung und Taschen direkt auf der Seite; Velopflege zeigt oben, was fällig ist. |
| 0.106.0 | Packen, Tasche für Tasche | Taschen als eine Liste, Teile klappen darunter auf. «Unterwegs» zeigt den Tag in Blöcken mit Essen, Trinken, Kleidung. |
| 0.107.0 | Aktiv macht das Licht an | Aktiv hell: heute oben, Ziele mit Weg, Meilensteine im Regal, Seite «Muster», Meditations-Log mit 13-Wochen-Kalender. |
| 0.108.0 | Ich, endlich aufgeräumt | Ich in vier Gruppen, Backup-Band oben; Daten und Backup mit drei Lichtern und QR-Code fürs Handy. |
| 0.109.0 | Rückblick, frisch geduscht | Tour beenden und Rückblick in zwei Spalten; Zahlen-Kacheln, 12 Monate, Vergleich. |
| 0.110.0 | Was ist neu? Na, genau das hier. | Alle Funktionen mit Suche und sechs Sortierungen; Kachel «Neu» 14 Tage auf Heute; «Deine Top 10» zählt still mit (nur auf dem Gerät). |

Nebenwirkung, später entdeckt: Einige Funktionen rutschten durch den Refresh tiefer oder wurden versteckt (zum Beispiel Meditation unter Aktiv › Mehr). Das zeigte die Release-Analyse vom 14.10. (siehe [Dokument 4](04-entscheidungen.md#regel-was-faellt-weg-oder-rutscht-tiefer) und [Dokument 5](05-spezifiziert-und-offen.md)).

## Touren planen und packen

| Version | Titel | Was neu ist |
|---|---|---|
| 0.111.0 | Abends abhaken, morgens losziehen | Vorabend-Check auf «Gepackt» und Schluss-Check nach der Tour, je Reiseart eine eigene Liste; «Liste anpassen» mit eigenen Punkten oder Ideen aus früheren Rückblicken. Checks pro Reiseart unter Ich. |
| 0.114.0 | Neue Tour, gut eingerahmt | «Rahmenbedingungen»: Sportart, Wetter aus der Start-Postleitzahl, Event. Vorlagen als Knöpfe; Packliste in vier Gruppen mit Bild pro Teil; Reparatur und Laden nur auf Wunsch. |
| 0.119.0 | Tour mit 1 Klick | «Schnellstart» auf Heute plant eine Tour für heute (2,5 h, zuletzt gefahrenes Velo, Standardteile, Wetter aus der Vorhersage). Ersetzt die frühere «Tagestour». |
| 0.124.0 | Bausteine zum Antippen | Bausteine als grosse Knöpfe oben in Packen (grün = dabei, weiss mit + = dazunehmen). Reparatur unterwegs mit höchstens 8 leichten Teilen. |

## Velo

| Version | Titel | Was neu ist |
|---|---|---|
| 0.115.0 | Menüs, die verstehen | Ein Tipp neben ein offenes •••-Menü schliesst es. |
| 0.116.2 | Velo-Werte dort eintragen, wo du bist | Fehler behoben: «eintragen» auf Velo-Pass und Abhol-Check öffnet genau diesen Wert und bringt zurück. |
| 0.117.0 | Knöpfe, die sich erklären | Ein Hauptknopf pro Zeile, Rest hinter «…»; lange Erklärung beim Zeigen (Computer) oder langen Drücken (Handy); nach «Erledigt» eine Zeile mit «Rückgängig». |
| 0.122.0 | Werte in einem Zug | Abhol-Check mit Karte pro Wert und «Weiter»; neue Seite «Werte erfassen» unter Ausstattung; «Felder wählen» und «Eigenes Feld». |
| 0.131.2 | Velos wieder in Reih und Glied | Velo-Reiter folgen wieder der gewählten Reihenfolge (Fehler aus 0.131.0). |

## Strava

| Version | Titel | Was neu ist |
|---|---|---|
| 0.116.0 | Strava, komm rein | Einmal verbinden: alle alten Fahrten kommen, keine doppelt; neue kommen von selbst oder mit «Jetzt holen». Anderes Velo in Strava? Heute fragt «Übernehmen» oder «Behalten». Puls pro Fahrt (nur zum Anschauen); Fahrten ohne Velo warten in «Zum Prüfen». |
| 0.121.0 | Strava-Fahrten zählen mit | Strava-Fahrten zählen bei «Diese Woche» und «Velo in diesem Monat», jede Fahrt einmal. |

Technisch: Der geheime Strava-Schlüssel liegt nur in der Vercel-Umgebung, nie im Code. Strava bleibt daneben auch als Datei-Import möglich.

## Aktiv und Motivation

| Version | Titel | Was neu ist |
|---|---|---|
| 0.123.0 | Alle deine Sterne in einer Vitrine | Trophäen-Vitrine: alle erreichten Sterne nach Bereich und Jahr; «Als Nächstes erreichbar». |
| 0.131.1 | Abgehakt ist einmal abgehakt | Fehler behoben: Doppeltipp hakte doppelt ab, darum liess sich nicht mehr abwählen. Jetzt nimmt ein Tipp das Häkchen zurück. |

## Was ist neu und Hilfe

| Version | Titel | Was neu ist |
|---|---|---|
| 0.118.0 | Was neu ist, neu erzählt | Jede Version mit Titel, einem Satz und Hauptpunkten; Kleinkram in Neu, Schöner, Repariert, Schneller. Der **KI-Helfer ist ab Werk aus** (ein Schalter unter Ich holt ihn zurück), weil er Geld kostet. |

## Fehler und Aufräumen

| Version | Titel | Was neu ist |
|---|---|---|
| 0.116.1 | Alte Touren öffnen wieder | Rückblick älterer Touren (aus altem Backup oder Excel-Import) öffnete eine leere Seite. Behoben. |
| 0.131.0 | Mehr Ordnung | Einmalige Datenbereinigung: alte Kopien an ihren neuen Platz, Gewichts-Prüfungen aus der Excel als Notiz, alte Kits und «Auf jeder Tour» in den Bausteinen. Vorher legt die App eine ganze Kopie auf dem Gerät an. Persönliche Angaben, die bisher im öffentlichen Code standen, wurden in eine private Importdatei verschoben. |

## Pull Requests seit 0.96 (gemerged)

Die Releases kamen über Pull Requests, die Noah selbst gemerged hat. Die genaue Zuordnung Version zu PR steht in [status.md](../status.md) und in der GitHub-Liste der geschlossenen Pull Requests. Die letzten drei: #158 (0.131.0), #163 (0.131.1), #162 (0.131.2), alle am 14.10.2026.
