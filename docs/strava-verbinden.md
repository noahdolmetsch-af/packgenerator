# Strava verbinden (ab 0.116.0)

So holt die App deine Fahrten mit ihrem Velo direkt aus Strava. Freiwillig, jederzeit trennbar. Die App liest nur, sie schreibt nichts in Strava.

## Einmal prüfen: Strava-Einstellungen

1. Öffne am Computer **strava.com/settings/api** (eingeloggt mit deinem Strava-Konto).
2. Bei **«Authorization Callback Domain»** muss stehen: `packgen-three.vercel.app`
   - Steht etwas anderes: auf **«Edit»** klicken, `packgen-three.vercel.app` eintragen, **«Update»**.
3. Fertig. Die Client-ID und das Secret (`STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`) sind schon im Vercel-Projekt **«packgen»** gespeichert. Das Secret nie in einen Chat, eine Datei oder das Repo kopieren.

## Verbinden (Computer und Handy je einmal)

1. In der App: **Velo › Pflege › Strava** (oder Pflege › Mehr › «Strava»).
2. **«Mit Strava verbinden»** tippen.
3. Bei Strava einloggen und **«Autorisieren»** tippen. Den Haken bei den Aktivitäten anlassen.
4. Du landest wieder in der App. Sie holt einmal alle alten Fahrten und zeigt, was sie gefunden hat: schon da (aus dem CSV), schon im km-Stand, neu zugeordnet, zum Prüfen.
5. **«Fertig»** tippen. Gibt es Fahrten **zum Prüfen**: dort pro Fahrt **«Passt»**, «Anderes Velo» oder «Zählt nicht».

Das Handy verbindest du genau gleich: auf dem Handy die App öffnen und Schritte 1 bis 3 machen. Jedes Gerät bekommt seinen eigenen Schlüssel; er bleibt auf dem Gerät und ist in keinem Backup.

## Einstellungen (alles änderbar)

- **Fahrten holen:** «Automatisch beim Öffnen» (höchstens alle 15 Minuten) oder «Nur per Knopf». «Jetzt holen» geht immer.
- **Fahrt ohne Velo:** «Zum Prüfen mit Vorschlag» oder «App ordnet selbst nach Fahrtart zu».
- **Velo in Strava ↔ Velo in der App:** gleiche Namen sind schon verbunden. Antippen, um ein anderes Velo oder «Zählt nicht» zu wählen.
- **Velo in Strava geändert:** Hat eine Fahrt in Strava ein anderes Velo bekommen, fragt die App oben auf Heute und beim Velo: «Übernehmen» oder «Behalten».

## Trennen

Velo › Pflege › Strava › **«Trennen»**. Du wählst: Fahrten behalten oder die geholten Fahrten entfernen. Strava zieht den Zugriff zurück.

## Wenn etwas nicht geht

- «Strava ist ausgelastet»: 15 Minuten warten, dann «Jetzt holen».
- «Strava braucht ein neues Login» oder «nicht mehr verbunden»: nochmals «Mit Strava verbinden».
- Strava geht gar nicht: **Mehr › Datei importieren (Reserve)** mit dem Strava-Export wie bisher.
