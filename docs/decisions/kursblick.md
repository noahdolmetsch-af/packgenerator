# Kursblick: kleine App für Gold und SMI

22.11.2026 · Auftrag: Noah «1-4a» und «ja» (Thread «Mockup für Kurse von Gold, SMI und Aktien»)

- Kursblick ist eine kleine App **im** Packgenerator («universelle App für alles Coole»), keine eigene App (1a).
- Der Vercel-Server «packgen» holt die Kurse (nicht das Handy, die Quellen senden kein CORS); er speichert nichts in einer Datenbank, Vercels Cache hält eine Antwort sechs Stunden. Das Gerät merkt sich die letzte Antwort im Cache des Browsers (keine Dexie-Tabelle, kein Backup-Format).
- Quellen: Stooq und Yahoo Finance, inoffiziell, nur private Nutzung, mit zweiter Quelle als Ausweich (2a). Keine Kursdateien im öffentlichen Repo (Lizenz).
- Es zählt der Schlusskurs vom Vortag; der Tag von heute wird weggelassen. Verlauf so weit gratis, sonst «Daten seit …».
- Referenztag Gold: 1.11.2026 (ein Sonntag): es gilt der letzte Schlusskurs davor, Fr 30.10.2026 (Noah 22.11.2026 «ok»). Änderbar.
- Verkaufswert = Preis minus Händlerabschlag, Standard 2 %, änderbar; Vorschläge je Art (Barren 2 %, Münzen 4 %, Altgold 8 %) sind erfundene Richtwerte, keine Zusage eines Händlers.
- Name «Kursblick» (3a). Zuerst Welle K-A, dann die Breite (4a).
