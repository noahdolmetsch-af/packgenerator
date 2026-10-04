# Lern-Seite: So funktioniert Pack Generator

Diese Seite wächst mit jedem Pull Request. Sie erklärt in einfachen Worten, wie die App aufgebaut ist.

## 1. Die Bausteine

| Baustein | Was er macht |
|---|---|
| **HTML / CSS / JavaScript** | Die Sprache jeder Webseite: HTML ist der Inhalt, CSS das Aussehen, JavaScript das Verhalten. |
| **Svelte** | Ein Werkzeug, mit dem man die App aus *Komponenten* baut. Eine Komponente ist eine `.svelte`-Datei mit drei Teilen: `<script>` (Logik), HTML (Inhalt) und `<style>` (Aussehen, gilt nur für diese Komponente). |
| **Vite** | Der "Bauhelfer". Beim Entwickeln zeigt er Änderungen sofort im Browser. Beim Bauen (`npm run build`) packt er alles in den Ordner `dist/`, der dann ins Internet kommt. |
| **PWA (Progressive Web App)** | Eine Webseite, die man wie eine App installieren kann und die ohne Internet startet. Dafür braucht es ein *Manifest* (Name, Icon, Farben) und einen *Service Worker*. |
| **Service Worker** | Ein kleines Programm, das der Browser im Hintergrund behält. Beim ersten Besuch speichert es alle Dateien der App auf dem Gerät; danach liefert es sie auch offline aus. Das Plugin `vite-plugin-pwa` erzeugt ihn automatisch. |
| **GitHub Actions + Pages** | Bei jedem Merge auf `main` baut GitHub die App (`.github/workflows/deploy.yml`) und veröffentlicht sie gratis auf GitHub Pages. |

## 2. Wo liegt was?

```
index.html              Einstiegsseite; lädt src/main.js
src/main.js             Startet Svelte und hängt die App in die Seite
src/App.svelte          Die Startseite der App (bisher eine Komponente)
src/app.css             Trail-Journal-Farben und Schriften für alles
src/lib/                Datenbank, Backups und Bausteine (Komponenten)
tests/                  Automatische Tests
tools/import-excel/     Einmaliger Excel-Konverter
public/                 Dateien, die unverändert mitkommen (Icons, Prototyp)
public/cockpit/         Der Bike-Cockpit-Prototyp als eigene Offline-App
vite.config.js          Einstellungen für Vite und die PWA (Manifest, Offline-Cache)
.github/workflows/      Automatisches Bauen und Veröffentlichen
docs/                   Entscheide, Projektstand und diese Lern-Seite
```

## 3. Wichtige Begriffe aus `src/App.svelte`

- `let online = $state(navigator.onLine)`: `$state` macht eine Variable *reaktiv*. Wenn sich ihr Wert ändert, aktualisiert Svelte die Anzeige von selbst.
- `$effect(() => { ... })`: Code, der läuft, sobald die Komponente auf dem Bildschirm ist. Hier hört er auf die Browser-Ereignisse `online` und `offline`. Die zurückgegebene Funktion räumt wieder auf.
- `{#each chapters as ch (ch.no)} ... {/each}`: wiederholt ein Stück HTML für jedes Element einer Liste. `(ch.no)` ist der eindeutige Schlüssel.
- `class:off={!online}`: setzt die CSS-Klasse `off` nur, wenn die Bedingung stimmt.

## 4. Wie kommen Daten offline auf das Gerät?

- **Prototyp:** speichert alles im `localStorage` des Browsers (ein einfacher Text-Speicher pro Webseite). Der Backup-Dialog lädt diesen Text als JSON-Datei herunter oder schreibt eine Datei zurück.
- **Neue App:** speichert in **IndexedDB**, einer richtigen Datenbank im Browser, die viel mehr Daten fasst. Wir benutzen dafür die Bibliothek *Dexie* (`src/lib/db.js`).

Wichtig: Beide Speicher gehören zum *Browser auf diesem Gerät*. Darum gibt es Export/Import, um Daten zwischen Desktop und Phone zu bewegen und zu sichern.

## 5. Die Datenbank (`src/lib/db.js`)

- Eine **Tabelle** pro Art von Daten: `items` (Gear), `trips`, `debriefs`, `learnings` usw.
- In `db.version(1).stores({ items: 'id, category, ownership, …' })` steht pro Tabelle zuerst der **Primärschlüssel** (das Feld, das einen Datensatz eindeutig macht, z.B. `EL01`), danach die Felder, nach denen wir schnell suchen wollen (**Indexe**). Alle anderen Felder werden trotzdem gespeichert.
- `SCHEMA_VERSION`: Ändert sich später die Form der Daten, erhöhen wir die Zahl und schreiben einen Umbau-Schritt. So bleiben alte Daten lesbar.
- Tabelle `meta` ist nur für die App selbst (z.B. welcher Ordner für Backups gewählt ist) und kommt nie in eine Backup-Datei.

## 6. Backups (`src/lib/backup.js`, `src/lib/folderBackup.js`)

- `buildBackup` liest alle Tabellen und baut **ein JSON-Objekt**: `{ app, schemaVersion, exportedAt, tables }`.
- `validateBackup` prüft eine Datei, bevor irgendetwas geschrieben wird.
- `restoreBackup` schreibt alles in **einer Transaktion**: Entweder klappt alles, oder es ändert sich gar nichts. Ein Test prüft genau das ("a broken file changes nothing").
- Die **Ordner-Sicherung** nutzt die *File System Access API* von Chrome/Edge am Desktop. Der gewählte Ordner wird gemerkt; nach jeder Änderung (Dexie-"Hooks" melden jede Änderung) wartet die App 2 Sekunden und schreibt dann die Dateien. Nach einem Browser-Neustart verlangt Chrome aus Sicherheitsgründen einen Klick auf "Allow backup".

## 7. Svelte-Begriffe aus `src/lib/DataPanel.svelte`

- `liveQuery(...)` (von Dexie): eine Abfrage, die sich selbst neu ausführt, wenn sich die Daten ändern. Mit `$counts` liest Svelte den aktuellen Wert.
- `$state.raw(...)`: wie `$state`, aber Svelte "verpackt" den Inhalt nicht. Nötig, weil die Datenbank nur reine Daten speichern kann.
- `onclick={exportFile}`: ruft die Funktion beim Klick auf.

## 8. Seiten und Gear (`src/App.svelte`, `src/pages/`, `src/lib/gear/`)

- **Router:** `App.svelte` schaut auf den Teil der Adresse nach `#` (z.B. `#/gear`) und zeigt die passende Seite. Das funktioniert offline und braucht keinen Server.
- **Regeln getrennt vom Aussehen:** `src/lib/gear.js` enthält nur Rechnungen (Totale, Suche, "To weigh"-Reihenfolge, neue IDs). Die `.svelte`-Dateien zeigen nur an. So lassen sich die Regeln mit Tests prüfen (`tests/gear.test.js`).
- `$derived(...)`: ein Wert, der aus anderen Werten berechnet wird und sich selbst aktualisiert, z.B. `stats` aus der Liste aller Teile.
- `src/lib/media.svelte.js`: merkt sich, ob der Bildschirm schmal ist (Phone). Komponenten lesen `phone.matches` und passen sich an.
- Gewicht: In der Datenbank steht das Gewicht **eines Stücks** (`weightG`) und die **Anzahl** (`qty`). Angezeigt wird `weightG × qty`, z.B. Seitentaschen 2 × 450 g = 900 g.
- **Aufklappen:** `folded` merkt sich pro Kategorie, ob sie zu ist. `isOpen(key)` entscheidet: beim Suchen immer offen, sonst nach `folded`.
- **Einmalige Aufräum-Arbeit beim Start:** `src/lib/brand.js` trennt Hersteller und Modell (`splitBrand`). `tidyBrands` läuft bei jedem Start, ändert aber nur Teile ohne Feld `model`. Darum passiert es pro Teil genau einmal, und man muss nichts neu importieren.
- **CSS nur für Mäuse:** `@media (hover: hover)` gilt nur auf Geräten mit Maus. So bleibt am Phone nach dem Antippen keine Zeile farbig hängen.

## 9. Bikes und Pack (`src/lib/bikes.js`, `src/lib/trips.js`, `src/pages/Bikes.svelte`, `src/pages/Pack.svelte`)

- **Plätze statt Taschen:** `SLOTS` sind die Stellen am Velo (Sattelstütze, Rahmendreieck …). Eine Tasche gehört zu genau einem Platz. Ein Velo sagt, welche Plätze es hat (`slots`) und welche Tasche dort normalerweise hängt (`setup`).
- **Die Zeichnung** (`BikeStage.svelte`) rechnet die Kästchen aus einem 720 × 420 Bild in Prozent um. So wächst und schrumpft sie mit dem Bildschirm.
- **Eine Tour** speichert eine Kopie des Velo-Setups und eine Liste `entries` (Teil, Platz, Anzahl, abgehakt). Alle Gewichte rechnet `tripStats` aus dieser Liste, nichts wird doppelt gespeichert.
- **Datenbank-Version 2:** `db.version(2)` fügt nur die Tabelle `containers` hinzu. Dexie macht das beim nächsten Öffnen selbst, bestehende Daten bleiben.
- **Daten-Updates aus dem Chat** (`src/lib/updates.js`): Änderungen, die du im Chat beschreibst (z.B. welche Taschen an welchem Velo hängen), laufen einmal pro Gerät. Sie ändern nur die genannten Felder, deine eigenen Eingaben bleiben.
- **Drucken:** `@media print` in `Pack.svelte` blendet alles aus ausser der Liste pro Tasche. Im Druckdialog "Als PDF speichern" wählen.
- **Schichten** (`src/lib/layers.js`): Ein Teil kann Felder wie `ride: 'daily'`, `coldBelow: 10` oder `rain: 'yes'` haben. `layerSuggest` liest die Tour (Fahrtart, Stunden, Wetter) und gibt eine Liste zurück: was dazukommt, warum, getragen oder eingepackt, wie viele Stück. Die Regeln stehen also in den Daten, nicht im Code. Darum kannst du sie in Gear selbst ändern.
- **Ersetzen** (`src/lib/replace.js`): Wird ein Teil ersetzt, sucht `replaceEverywhere` alle Touren, Taschen und Halterungen mit der alten ID und setzt die neue ein. Das läuft in einer Transaktion, also ganz oder gar nicht.
- **Neues Pack-Layout** (`src/lib/pack/NotPacked.svelte`): Drei Spalten. Die Liste "Not packed" gruppiert nach Kategorie, Gruppen sind zugeklappt. Jedes Teil kann man mit der Maus ziehen (`draggable`): `dataTransfer` trägt die Teil-ID, und die Tasche auf der Zeichnung oder die offene Tasche nimmt sie mit `ondrop` an. Mit `{#snippet}` wird ein Stück Oberfläche (z.B. die Schichten) einmal geschrieben und am Desktop in der rechten Spalte, am Phone im Add-Tab gezeigt.
- **Ready-Check** (`READY_DEFAULT`, `freshReady`, `alwaysEntries` in `src/lib/trips.js`): Eine neue Tour bekommt die gespeicherte Standardliste (Einstellung `readyStandard`) oder die vorgeschlagene. Teile mit `always: true` kommen in jede neue Tour, auch wenn sie eine Kopie der letzten ist.
- **Aufräumen beim Start** (`src/lib/tidy.js`): Taschenliste anlegen, Velos ergänzen, alte Touren umstellen. Jeder Schritt ändert nur, was es noch braucht.

## 9b. Bike care (`src/lib/care.js`, `src/pages/Care.svelte`)

- **Alles ist Verlauf:** Jedes Teil eines Velos hat eine Liste `history` mit Einträgen (Datum, km, Messwert, Aktion, Ergebnis). Was fällig ist, wird jedes Mal aus diesem Verlauf und dem km-Stand ausgerechnet, nichts davon wird extra gespeichert. Darum kann nichts "veralten".
- **Fristen vor einer Tour:** `prepFor` nimmt das Startdatum und zieht pro Aufgabe den Vorlauf in Wochen ab. Die Ergebnisse stehen auf der Tour (`trip.prep`), jede Tour hat also ihre eigene Liste.
- **Keine neue Tabelle:** Teile hängen am Velo, Vorbereitung an der Tour, Arbeiten in der schon importierten Tabelle `maintenance`. Darum braucht es keine neue Datenbank-Version, und das Backup enthält alles.

## 10. Tests

`npm test` startet **Vitest**. Die Tests liegen in `tests/` und laufen ohne Browser: `fake-indexeddb` spielt die Browser-Datenbank im Speicher nach. Getestet wird z.B., dass Export → Import genau dieselben Daten ergibt.

## 11. Selbst ausprobieren

```
npm install       # einmal: Bausteine herunterladen
npm run dev       # App lokal starten, Änderungen erscheinen sofort
npm run build     # fertige App in dist/ bauen
npm run preview   # gebaute App lokal ansehen (inkl. Offline-Funktion)
npm test          # alle Tests laufen lassen
```
