# Notfall-Handbuch

Stand 26.10.2026. Für Noah, in einfachem Deutsch. Dieses Handbuch liegt auf GitHub und bleibt da, auch wenn du Claude nicht mehr nutzt. Jeder andere Helfer (eine andere KI oder ein Mensch) kann damit arbeiten.

Weitere Seiten:
- [Konten-Liste](konten.md): alle Konten, die die App braucht, ohne Passwörter.
- [Wann du etwas tun musst](wann-du-etwas-tun-musst.md): neues Gerät, Login abgelaufen, KI-Guthaben leer.
- In der App: **Ich** › **App verstehen**, der Mini-Kurs in 7 Lektionen mit Übungen.

---

## 1. So ist die App gebaut (in einem Satz pro Teil)

| Teil | Vergleich | Wo | Was passiert, wenn er wegfällt |
|---|---|---|---|
| Der Code | Bauplan in der Bibliothek | GitHub, Repository `packgenerator` | Nichts, solange niemand etwas ändern will |
| Die fertige App | Schaufenster | GitHub Pages: https://noahdolmetsch-af.github.io/packgenerator/ | Deine Geräte haben eine Kopie und starten weiter, auch offline |
| Deine Daten | Rucksack | Im Browser-Speicher deines Handys und Computers | **Weg, wenn kein Backup da ist.** Darum Teil 3 |
| Die Extras | Hilfsküche nebenan | Server «packgen» bei Vercel, mit Schliessfach Upstash | Strava, Fitbit/Google, KI, Abgleich, Erinnerungen fallen aus. Der Rest läuft |

**Merke:** Packen, Planen, Touren, Velos, Material und Notizen brauchen keinen Server und keinen Helfer. Sie laufen weiter, auch wenn niemand mehr etwas am Code macht.

**Was von selbst läuft:**
- Jeden Morgen prüft der **Wächter** den Server und der **Live-Check** die echte App. Nur bei einem Fehler bekommst du eine Mail von GitHub (ein «Issue»).
- **Dependabot** schlägt jeden Tag Updates der Bibliotheken vor. Sind die Tests grün, kommen sie von selbst online.
- Vor jeder neuen Version legt die App auf deinem Gerät eine Kopie deiner Daten an (**Ich** › **App-Wartung**).

---

## 2. Wenn etwas kaputt ist

Gehe die Schritte der Reihe nach durch. Hör auf, sobald es wieder geht.

### Schritt A: Welcher Teil ist kaputt?
- **Die App startet nicht oder eine Seite zeigt «Hier ist etwas schiefgelaufen»** → Schritt B.
- **Nur ein Extra geht nicht** (Strava, Fitbit, Termine, Mail, KI, Abgleich, Erinnerungen) → Schritt C.
- **Seit einer neuen Version ist etwas schlechter** → Schritt D.
- **Du hast eine Mail vom Wächter oder Live-Check bekommen** → Schritt E.

### Schritt B: App startet nicht
1. Auf der Fehlerseite **Neueste Version laden** tippen. Deine Touren, Listen und Notizen bleiben.
2. Geht das nicht: Am Computer in Chrome `chrome://serviceworker-internals` öffnen › mit Cmd+F `packgenerator` suchen › **Unregister** › die App neu öffnen.
3. **Nie** «Websitedaten löschen» wählen: das löscht deinen Rucksack.
4. Unten steht ein brauner Balken «Test preview»? Dann bist du in einer Test-Version. Tab schliessen und die richtige App öffnen (Link oben).

### Schritt C: Ein Extra geht nicht
1. Steht in der App «Neu verbinden» oder «Mit Strava/Google verbinden»: antippen und erlauben. Details: [Wann du etwas tun musst](wann-du-etwas-tun-musst.md), Abschnitt 2.
2. KI-Knöpfe weg: das KI-Guthaben ist leer. Nichts tun ist in Ordnung.
3. Schau, ob der Server läuft: https://vercel.com › Projekt **packgen** › **Deployments**. Der oberste Eintrag soll **Ready** (grün) sein.
4. Ist er rot (**Error**): beim letzten grünen Eintrag auf **…** › **Promote** (oder **Instant Rollback**). Damit läuft wieder die letzte gute Server-Version.
5. Geht es immer noch nicht: Teil 4 (Helfer fragen). Der Rest der App läuft weiter.

### Schritt D: Neue Version ist schlechter, zurück zur alten
1. https://github.com/noahdolmetsch-af/packgenerator/pulls?q=is%3Amerged öffnen.
2. Den obersten (neuesten) Pull Request öffnen.
3. Ganz unten auf **Revert** klicken › **Create pull request**.
4. Warten, bis alle Haken grün sind › **Merge pull request** › **Confirm merge**.
5. Nach etwa 30–60 Minuten ist die alte Version online. In der App erscheint «Jetzt laden».

### Schritt E: Mail vom Wächter oder Live-Check
1. Die Mail öffnen. Sie führt zu einem «Issue» auf GitHub. Dort steht, was nicht geht (zum Beispiel «Strava: Login abgelaufen»).
2. Steht dort ein Login: Schritt C.1.
3. Einmalige Meldung, am nächsten Tag von selbst geschlossen: nichts tun.
4. Kommt sie mehrere Tage: Teil 4.

---

## 3. Backup: deine Daten sichern

**Einmal im Monat** (die App erinnert dich von selbst, Standard alle 14 Tage; ändern unter **Ich** › **Eigene Werte** › «Backup-Erinnerung alle»):
1. **Ich** › **Daten und Backup** › **Backup exportieren**.
2. Die Datei an **zwei** Orten ablegen, zum Beispiel Google Drive und ein USB-Stick.

**Am Computer zusätzlich (einmal einrichten):** **Ich** › **Daten und Backup** › **Auto-Backup in einen Ordner** › **Ordner wählen**. Die App schreibt danach nach jeder Änderung eine Datei in diesen Ordner.

**Zurückspielen:** **Ich** › **Daten und Backup** › Datei wählen › **Import prüfen** › Ersetzen oder Zusammenführen.

**Den Code sichern (viermal im Jahr, freiwillig):** Der Code liegt sicher auf GitHub. Für eine eigene Kopie: https://github.com/noahdolmetsch-af/packgenerator › grüner Knopf **Code** › **Download ZIP** › zu den Backups legen.

**Deine Konten sichern (einmal):** Für GitHub, Google und Vercel die **Wiederherstellungs-Codes** (recovery codes) ausdrucken und zu Hause aufbewahren. Ohne GitHub-Zugang kann niemand mehr etwas ändern. Wo: GitHub › Profilbild › **Settings** › **Password and authentication** › **Recovery codes**.

---

## 4. Einen anderen Helfer einweisen

Die App ist ganz normale Web-Technik (Svelte, Vite, JavaScript). Jeder, der Webseiten baut, kann daran arbeiten. Auch andere KIs können es: zum Beispiel GitHub Copilot (direkt auf GitHub), ChatGPT oder Gemini.

**Gib dem Helfer diese drei Dateien:**
1. [CLAUDE.md](../CLAUDE.md): wie das Projekt funktioniert und welche Regeln gelten (gilt für jeden Helfer, nicht nur Claude).
2. [Projektstand](projektstand.md): was gerade online ist und was geplant ist.
3. Dieses Notfall-Handbuch und die [Konten-Liste](konten.md).

**Vorlage für die erste Nachricht** (kopieren und anpassen):

> Ich habe eine Web-App: https://github.com/noahdolmetsch-af/packgenerator (öffentlich). Lies zuerst CLAUDE.md, docs/projektstand.md und docs/notfall-handbuch.md. Ich bin kein Entwickler. Erkläre mir alles in einfachem Deutsch, Klick für Klick. Mein Problem: … (was geht nicht, seit wann, Foto oder Fehlermeldung). Bitte ändere nur, was für dieses Problem nötig ist, und mach einen Pull Request, den ich selbst prüfen und mergen kann.

**Geheimnisse nie weitergeben:** Schlüssel und Passwörter liegen nur bei Vercel und in deinem Passwort-Manager. Ein Helfer braucht sie nicht zu sehen. Wenn er etwas in Vercel ändern muss, klickst du selbst.

---

## 5. Was du nie tun solltest
- Websitedaten der App löschen (löscht deine Daten).
- Schlüssel oder Passwörter in einen Chat, eine Datei auf GitHub oder ein Issue schreiben.
- Persönliche Dateien (Backups, Fotos, Belege, GPX) auf GitHub hochladen: das Repository ist öffentlich.
- Einen Pull Request mergen, dessen Haken rot sind (ausser beim Zurücknehmen in Schritt D, wenn es eilt).
