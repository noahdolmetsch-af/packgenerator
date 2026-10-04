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
| 4.10.2026 | **Datenbank: IndexedDB über Dexie**, ein Datenmodell für alle Bereiche (`src/lib/db.js`) | Offline, viel Platz, gut lesbare Abfragen |
| 4.10.2026 | **Ein Dateiformat für alles:** Export, Import, Ordner-Sicherung und Excel-Import nutzen dieselbe Backup-Datei | Nur ein Weg, der getestet werden muss |
| 4.10.2026 | Import fragt **"Replace all data" oder "Merge"**; schlägt etwas fehl, bleibt alles unverändert | Daten dürfen nie verloren gehen |
| 4.10.2026 | Ordner-Sicherung schreibt `pack-generator-latest.json` plus eine Datei pro Tag | Neuester Stand für das Phone, Verlauf als Sicherheit |
| 4.10.2026 | Excel-Konverter nimmt englische Texte aus dem Prototyp; der Rest kommt aus einer **privaten Übersetzungsdatei** im Projektordner | Persönliche Daten bleiben ausserhalb des öffentlichen Repos |
| 4.10.2026 | "303 Plan" wird ein geplanter Trip; Alpenbrevet-Etappen hängen am Event; Dashboard, Quellen und Anleitung werden nicht importiert | Diese drei Blätter beschreiben nur die Excel selbst |
| 4.10.2026 | Standard-Tasche pro Teil nach den Regeln des Prototyps (Packliste, sonst Bibliothek, sonst Kategorie) | In der Excel fehlt sie bei 153 von 191 Teilen |
| 4.10.2026 | Gear: **Ledger und Board aus dem Prototyp** übernehmen (Ledger zuerst) | Design schon entschieden |
| 4.10.2026 | **To weigh: ein Teil nach dem anderen** ("Waage-Modus") | Schnell an der Waage |
| 4.10.2026 | Prototyp-Daten später per Backup übernehmen; Prototyp bleibt, bis Packen in der neuen App fertig ist | Kein Datenverlust, kein harter Umstieg |
| 4.10.2026 | **Eigene Taschenliste** (nicht nur Teile der Kategorie "Bags") | Noah, Antwort 5b |
| 4.10.2026 | **Vier Velo-Setups** (Scott Hardtail, Fully, Gravel, Factor LS) | Noah, Antwort 6b |
| 4.10.2026 | **Ready-Check: feste Liste wird immer vorgeschlagen, ist aber pro Tour bearbeitbar** | Noah, Antwort 7 |
| 4.10.2026 | **Eigene Seite "Bike care"**, die zum Event-Datum an Wartung erinnert | Noah, Antwort 8b |
| 4.10.2026 | Packen zeigt zusätzlich **Systemgewicht mit Velo und Fahrer** | Noah, Antwort 9b |
| 4.10.2026 | Idee QR-Kleber an Taschen: **notiert, später entscheiden** | Noah, Antwort 10b |
| 4.10.2026 | Gear zuerst als **Ledger**; Board folgt als zweite Ansicht in einem eigenen Schritt | Kleinere, prüfbare Schritte |
| 4.10.2026 | Gewicht wird **pro Stück** gespeichert, angezeigt als Stück × Anzahl; im Waage-Modus wiegt man alle Stücke zusammen | Paare (Seitentaschen, Pouches) richtig rechnen |
