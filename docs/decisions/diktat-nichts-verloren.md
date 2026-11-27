# Diktat: Speichern und Stopp behalten das Gesprochene

27.11.2026 · Auftrag: Noah (Thread «Spracheingabe bei Notizen reparieren»)

- Beste Praxis fürs Diktieren: Was gesagt wurde, geht nie verloren. «Speichern» und «Stopp» machen die noch «gehörten» Wörter zu Text, bevor sie weitermachen (`dictate.js`, `flushDictation` in `dictation.svelte.js`, Aufnahme-Knopf in `SpeakButton.svelte`).
- Der rote Hinweis erscheint erst beim Speichern und nur, wenn wirklich nichts da ist; er verschwindet, sobald Wörter ankommen.
- Verworfen: den Speichern-Knopf sperren, solange die Aufnahme läuft (Noah müsste erst Stopp tippen, mehr Tipps ohne Nutzen).
