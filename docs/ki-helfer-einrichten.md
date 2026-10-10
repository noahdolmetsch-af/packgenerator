# KI-Helfer einrichten (ab 0.67.0)

Der Helfer läuft über den kleinen Server der App auf Vercel (Projekt **packgen**, https://packgen-three.vercel.app). Die App selbst kennt keinen Schlüssel von Anthropic: Sie schickt nur deinen **Helfer-Code** mit, und der Server fragt Claude. Ohne Einrichtung funktioniert die App wie bisher.

Du brauchst etwa 10 Minuten. Schreib den Schlüssel und den Code nirgends sonst auf, nicht in eine Notiz der App, nicht ins Repo und nicht in einen Chat.

## 1. API-Schlüssel bei Anthropic holen

1. Öffne https://console.anthropic.com und melde dich an.
2. Links **Settings** → **Billing**: ein Zahlungsmittel hinterlegen und etwas Guthaben laden (z. B. 10 USD).
3. Links **API Keys** → **Create Key**. Name: `packgen-helfer`. **Create**.
4. Den Schlüssel (beginnt mit `sk-ant-`) **kopieren**. Er wird nur einmal gezeigt. Lass das Fenster offen, bis Schritt 3 erledigt ist.

## 2. Ausgabenlimit auch bei Anthropic setzen

Die App hat ein eigenes Monatslimit (Standard CHF 5). Als zweite Sicherung:

1. In der Console **Settings** → **Limits** (bzw. **Spend limits**).
2. **Monthly spend limit** auf z. B. **10 USD** setzen und speichern.

Ist dieses Limit erreicht, antwortet Claude nicht mehr; die App zeigt dann ruhig «Der Helfer konnte diesmal nicht antworten».

## 3. Einen zufälligen Helfer-Code machen

Der Helfer-Code ist wie ein Passwort zwischen App und Server. Mach ihn lang und zufällig, z. B. so:

- **Mac:** Programm «Terminal» öffnen, eintippen und Enter drücken:
  `openssl rand -base64 32`
- **Windows:** «PowerShell» öffnen und eintippen:
  `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))`
- **Ohne Terminal:** einen Passwort-Manager (z. B. den in iCloud-Schlüsselbund oder 1Password) ein Passwort mit 40 Zeichen erzeugen lassen.

Den Code kopieren und im Passwort-Manager unter «Pack Generator Helfer-Code» ablegen.

## 4. Beides in Vercel eintragen

1. Öffne https://vercel.com und dort das Projekt **packgen** (nicht «packgenerator»).
2. Oben **Settings** → links **Environment Variables**.
3. Erste Variable:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** der Schlüssel aus Schritt 1
   - **Environments:** Production (und Preview, wenn du Vorschauen testen willst)
   - **Sensitive** einschalten → **Save**.
4. Zweite Variable:
   - **Key:** `HELPER_TOKEN`
   - **Value:** der Helfer-Code aus Schritt 3
   - gleiche Environments, **Sensitive** → **Save**.
5. Freiwillig:
   - `HELPER_MONTHLY_CHF` = Monatslimit des Servers in Franken (ohne Eintrag: 5).
   - `HELPER_MODEL` = anderes Claude-Modell (ohne Eintrag: `claude-sonnet-5-5`).
6. Speicher für den Monatszähler: Unter **Storage** muss eine **Upstash Redis**-Datenbank mit dem Projekt verbunden sein (dann gibt es die Variablen `KV_REST_API_URL` und `KV_REST_API_TOKEN` schon). Falls nicht: **Storage** → **Create Database** → **Upstash** → **Redis** → Region Frankfurt → **Connect Project** → packgen.

## 5. Neu veröffentlichen (Redeploy)

Neue Variablen gelten erst nach einem neuen Deployment:

1. Im Projekt **packgen** oben **Deployments**.
2. Beim obersten Eintrag rechts **⋯** → **Redeploy** → **Redeploy**.
3. Warten, bis der Status **Ready** ist (1–2 Minuten).

## 6. Den Helfer-Code in der App eingeben

Auf jedem Gerät, auf dem du den Helfer willst:

1. App öffnen → **Mehr** → **Helfer** (oder in «Neue Tour» bei «Der Helfer ist noch nicht eingerichtet» auf **Einrichten**).
2. Bei **Helfer-Code** den Code aus Schritt 3 einfügen → **Speichern**.
3. **Verbindung prüfen** tippen. Es soll «Verbunden. Diesen Monat: CHF 0.00.» erscheinen.
4. Bei Bedarf das **Monatslimit** ändern (Standard CHF 5) → **Speichern**.

Der Code bleibt nur auf diesem Gerät. Er kommt nie in ein Backup, einen Export oder eine geteilte Liste. Auf einem neuen Gerät gibst du ihn neu ein.

## Wenn etwas nicht geht

| Die App sagt | Was tun |
|---|---|
| «Der Helfer-Code stimmt nicht» | Code in der App und `HELPER_TOKEN` in Vercel vergleichen (keine Leerzeichen am Ende), dann Redeploy. |
| «Der Helfer ist auf dem Server noch nicht bereit» | `ANTHROPIC_API_KEY` oder `HELPER_TOKEN` fehlt, oder der Speicher (Upstash) ist nicht verbunden. Schritt 4 und 5 prüfen. |
| «Der Helfer macht Pause bis …» | Das Monatslimit ist erreicht. Am 1. des nächsten Monats geht es von selbst weiter, oder das Limit in der App und `HELPER_MONTHLY_CHF` erhöhen. |
| «Gerade offline» | Kein Internet. Alles andere funktioniert weiter. |

## Ausschalten

- Nur auf einem Gerät: **Mehr** → **Helfer** → Schalter **Helfer eingeschaltet** aus.
- Ganz: in Vercel `HELPER_TOKEN` löschen und Redeploy, oder in der Anthropic Console den Schlüssel **Disable**/**Delete**.

## Was an Claude geht

Pro Anfrage nur, was die Aufgabe braucht: Namen, Kategorien und Gewichte deiner Sachen, Bausteine, Temperaturbereiche, die Bedingungen der Tour, deine Learnings und Notizen, und für die Velopflege die Teile mit km, Intervallen und letzten Service-Daten. Nie Fotos, Belege, Geldbeträge, Werkstattnamen, Dokumente, Gesundheitsdaten oder den Helfer-Code. Der Server speichert nichts ausser dem Monatszähler (`helper:spend:JJJJ-MM`) und schreibt keine Anfragen ins Log.
