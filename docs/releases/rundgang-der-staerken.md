# Rundgang der Stärken

Auftrag: Noah «ja» und «1-5a» (23.11.2026, Thread «Klarheit und Auffindbarkeit ab erstem Öffnen»). Ziele: Klarheit und Auffindbarkeit.

## Was ist neu
- Ich › Handbuch › Rundgang: neu **«Rundgang der Stärken»**, vier Stationen, je eine Frage eines Fahrers: «Wie weit komme ich mit Gepäck?» (Annahmen mit Herkunft), «Wo muss ich einkaufen?» (Läden-Lücken, Sonntage), «Welche Tasche …?» (Taschen und Gewicht), «Was tue ich heute?» (Heute abhaken, Abend-Check).
- Jede Station: die Frage mit einem Satz, **«Zeig mir ›»** (zeigt den echten Teil des Muster-Rennens, Heute oder Packen) oder **«Überspringen»**. Oben «Station n von 4».
- Das Muster-Rennen kommt dazu, wenn es noch nicht da ist (als Muster markiert, «Muster löschen» nimmt es weg). Deine eigenen Daten bleiben unberührt, die Spielwiese wird nicht gebraucht.
- Auffindbar über Ich › Handbuch und die Suche («Rundgang», «Stärken»).

## Was fällt weg oder rutscht tiefer
- Der Rundgang durch die Orte («Rundgang durch die App») ist nicht mehr der grosse Knopf im Handbuch, sondern steht als kleiner Rundgang bei den Rundgängen pro Ort. Nichts fällt weg.

## Selbst entschieden
- Station 3 zeigt die Packliste des Muster-Rennens; sie ist dort heute noch leer. Der nächste PR («Muster-Taschen») füllt sie mit Beispiel-Taschen.
- Kein neuer Katalogeintrag: `f.tour` beschreibt den Rundgang weiter (Text, Suchwörter, Handbuch-Schritte angepasst).
- Der Einstieg auf Heute («Neu hier?» in «Starte hier», `Home.svelte`) gehört dem Heute-Thread und startet noch den Rundgang durch die Orte. Der Heute-Thread stellt ihn auf `startStaerken` um.
- Die Zahlen der Stationen (zum Beispiel 104 km ohne Laden) stehen nicht im Text, sondern kommen live aus dem Muster-Rennen.

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- 23.11.2026: Rundgang nur auf Wunsch, neuer Haupt-Rundgang, Daten aus dem Muster (Noah «1-5a»): `docs/decisions/rundgang-der-staerken.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Rundgang der Stärken: Schritt 1 (Stationen) fertig; Muster-Taschen und «So sieht's aus» folgen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Handbuch › Rundgang › «Start ›» beim Rundgang der Stärken: die erste Frage erscheint.
2. «Zeig mir ›»: die Annahmen des Muster-Rennens leuchten; «Weiter ›», dann «Überspringen».
3. Am Ende «Fertig ›»; unter Touren › Rennen bleibt das Muster, «Muster löschen» nimmt es weg.
