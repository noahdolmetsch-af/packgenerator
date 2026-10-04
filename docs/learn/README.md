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
- **Neue App (nächster Schritt):** speichert in **IndexedDB**, einer richtigen Datenbank im Browser, die viel mehr Daten fasst. Wir benutzen dafür die Bibliothek *Dexie*.

Wichtig: Beide Speicher gehören zum *Browser auf diesem Gerät*. Darum gibt es Export/Import, um Daten zwischen Desktop und Phone zu bewegen und zu sichern.

## 5. Selbst ausprobieren

```
npm install       # einmal: Bausteine herunterladen
npm run dev       # App lokal starten, Änderungen erscheinen sofort
npm run build     # fertige App in dist/ bauen
npm run preview   # gebaute App lokal ansehen (inkl. Offline-Funktion)
```
