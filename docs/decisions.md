# Decision Log

Jede wichtige Entscheidung mit Datum, Entscheid und Grund. Neueste unten.

## Aus dem Projekt "Bike Cockpit" übernommen

| Datum | Entscheid | Grund |
|---|---|---|
| 3.10.2026 | Reihenfolge: Home/Packen → Gear → Debrief | Packen ist der Kernablauf |
| 3.10.2026 | Design "Trail Journal" für alle Bereiche, Desktop und Phone | Gewählt aus drei Varianten |
| 3.10.2026 | App-Sprache Englisch; nur ein Fahrer; Learnings aus Debriefs | |
| 3.10.2026 | Every-ride-Standard, Übernachtungs-Sets, Taschen-Volumen festgelegt | Siehe HANDOVER, Abschnitt 5 |
| 3.10.2026 | Fleece-Mütze unter 2 °C; lange Unterhose (KL27) unter 5 °C | |
| 4.10.2026 | Gear: Inventar, Wunschliste eigener Bereich, Phone nur nachschlagen/wägen | |
| 4.10.2026 | Gear: Ledger Hauptseite, Board zweite Seite | |
| 4.10.2026 | Debrief: nur "nicht benutzt" antippen, plus Wetter, Komfort, was fehlte, Notizen | Schnell direkt nach der Fahrt |
| 4.10.2026 | Debrief: alle drei Varianten (A, B, C) umschaltbar | |
| 4.10.2026 | Installierbare Web-App (PWA) für Desktop + Android, offline | Kein App Store, kostenlos |
| 4.10.2026 | Sync per Export/Import-Datei; App ist Hauptquelle, Excel einmal importieren | Nur ein Nutzer, keine Server-Kosten |

## Projekt "Pack Generator"

| Datum | Entscheid | Grund |
|---|---|---|
| 4.10.2026 | **Stack: Svelte 5 + Vite**, JavaScript (Typen später möglich) | Svelte-Code sieht aus wie HTML/CSS/JS, am leichtesten zu lernen; kleine, schnelle App |
| 4.10.2026 | **Öffentliches Repo + GitHub Pages**; persönliche Daten (Excel, Backups) nie im Repo | Kostenloses Hosting; Pages ist bei GitHub Free nur für öffentliche Repos gratis |
| 4.10.2026 | **Excel-Import: alles**, inkl. Learnings, Events, Wartung und Kits | Das ganze Wissen aus dem Logbuch soll in der App weiterleben |
| 4.10.2026 | **Alles auf Englisch übersetzen** (Kategorien und Teilenamen) | Einheitliche App-Sprache |
| 4.10.2026 | **Erstes Ziel: Gear und Packen zusammen** | Packen mit der App ist das Erfolgsziel, braucht aber das Inventar |
| 4.10.2026 | **Prototyp sofort als Offline-App** nutzbar machen | Schon jetzt mit der App packen, während die richtige App entsteht |
| 4.10.2026 | Prototyp **unverändert öffentlich** (inkl. Gear, Events, Learnings im Code) | Von Noah freigegeben; Ausnahme zu "Daten nie im Repo" nur für den Prototyp |
| 4.10.2026 | **Fehlende Gewichte: "To weigh"-Liste** auf dem Phone | 85 von 191 Teilen ohne Gewicht; wägen direkt mit Waage daneben |
| 4.10.2026 | **Datenmodell bereichsneutral** (Tour-Typ, Behälter statt nur Velotaschen) | Skitour, Reisen usw. später ohne Umbau |
| 4.10.2026 | **Backup: Desktop sichert automatisch in einen Ordner** (File System Access API) | Fast automatischer Sync ohne Server |
| 4.10.2026 | **Lernen: jeder PR mit Erklärung in einfachen Worten + Lern-Seite** (`docs/learn/`) | Noah will verstehen, wie der Code funktioniert |
