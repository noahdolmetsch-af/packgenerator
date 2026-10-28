# Wann du selbst etwas tun musst (und genau was)

Stand 19.10.2026. Im Alltag musst du nichts tun. Diese Fälle kommen selten vor. Meist sagt dir die App oder der Wächter von selbst, dass es so weit ist.

Ist etwas kaputt? Dann zuerst das [Notfall-Handbuch](notfall-handbuch.md). Alle Konten: [Konten-Liste](konten.md).

**Immer gilt:** nur in der richtigen App arbeiten: https://noahdolmetsch-af.github.io/packgenerator/
Unten steht ein brauner Balken «Test preview»? Dann bist du in der falschen App: Tab schliessen.

---

## 1. Neues Handy oder neuer Computer
**Woran du es merkst:** Du hast ein neues Gerät oder einen neuen Browser.

1. Auf dem neuen Gerät in **Chrome** die App öffnen (Link oben).
2. Altes Gerät: **Ich** › **Daten und Backup** › Abschnitt **Handy und Computer** › **Zweites Gerät koppeln**. Ein QR-Code erscheint.
3. Neues Gerät: Kamera auf den QR-Code › Link öffnen › **Koppeln**. Warten, bis «Gekoppelt» steht. Beim ersten Mal dauert es eine Weile.
4. Erscheinen Fenster «Auf beiden Geräten geändert»: am neuen Gerät **Für alle gleich entscheiden** › **Alle vom anderen Gerät**.
5. Nur am Handy: **Ich** › **Erinnerungen aufs Handy** › **Aufs Handy** einschalten › Chrome fragt › **Zulassen**.

## 2. Eine Verbindung ist abgelaufen (Google oder Strava)
**Woran du es merkst:** Die App zeigt eine Zeile wie «Strava braucht ein neues Login» oder auf einer Seite steht wieder **Mit Google verbinden**. Das passiert, wenn du das Passwort änderst oder etwas lange nicht benutzt.

**Strava:** auf **Mit Strava verbinden** klicken › bei Strava **Erlauben**.

**Google:** Die Seite öffnen, auf der es steht:
- Fitbit: **Ich** › **Daten und Backup** › **Fitbit**
- Dokumente: **Ich** › **Dokumente**
- Termine und Aufgaben: **Ich** › **Termine und Aufgaben**
- Mail: **Ich** › **Mail**

Dann:
1. **Mit Google verbinden** klicken.
2. Google sagt «nicht überprüft»: **Advanced** › weiter › alle Häkchen › **Continue**.
3. Landest du danach auf packgen-three mit «Test preview»: `chrome://serviceworker-internals` › mit Cmd+F `packgen-three` suchen › **Unregister** › nochmals ab Schritt 1.

## 3. Das KI-Guthaben ist leer
**Woran du es merkst:** Die App sagt einmal «KI-Guthaben aufgebraucht», danach sind die KI-Knöpfe weg. Alles andere geht weiter.

- **Nichts tun** ist in Ordnung, es kostet nichts.
- Willst du die KI wieder (kostet Geld): https://console.anthropic.com › **Billing** › Guthaben kaufen. Die KI kommt am nächsten Tag von selbst zurück.

## 4. Ein Gratisdienst ändert seine Regeln
**Woran du es merkst:** Eine Mail von Vercel, Upstash, cron-job.org, Google oder GitHub, oder der Wächter meldet sich hier.

1. Die Mail hier in den Thread kopieren oder ein Foto schicken.
2. Ich sage dir, ob es uns betrifft, und schlage einen Ersatz vor. Du klickst nur, wo ich es sage.

## 5. cron-job.org meldet einen Fehler
**Woran du es merkst:** Mail von cron-job.org «execution failed».

- Einmal ist harmlos (Server kurz weg). Kommt sie mehrere Tage: hier melden.

## 6. Dein Claude-Abo endet
Dann prüft und repariert niemand mehr. Die App läuft weiter, aber neue Fehler bleiben liegen.
- Vorher: **Ich** › **Daten und Backup** › **Backup exportieren** auf beiden Geräten.

## 7. Viele andere Menschen nutzen die App (Paket R)
**Woran du es merkst:** Ich sage es dir hier, oder der Wächter meldet «Tagesgrenze erreicht».

- **Google-Anmeldung:** Solange dein Google-Projekt im Modus «Testing» ist, können sich nur eingetragene Test-Nutzer anmelden, höchstens 100. Für alle: ein zweites, gratis Google-Projekt nur für «Mit Google anmelden» (es fragt nur nach der Mail-Adresse und braucht darum keine Prüfung durch Google). Ich gebe dir dann die Klicks. Kalender, Mail und Fitbit für alle bräuchten eine Prüfung durch Google (bei Mail kostet sie Geld): das machen wir nicht.
- **Strava:** Eine neue Strava-App erlaubt am Anfang nur wenige Personen. Für mehr: Antrag bei Strava (gratis). Heute ist Strava nur für dich.
- **Tagesgrenze:** Der Server macht höchstens 4000 Aufgaben pro Tag, damit nie eine Rechnung kommt. Wird sie erreicht, sagt die App «morgen wieder». Du musst nichts tun; meldet der Wächter es oft, schlage ich dir etwas vor.

---

## Einmal im Monat (freiwillig, 1 Minute)
**Ich** › **Daten und Backup** › **Backup exportieren**. Die Datei an einem sicheren Ort ablegen. Das ist die einzige Sicherung, die von keinem Dienst abhängt.
