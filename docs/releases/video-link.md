# Einen Link zu einem Video behalten

PR #<Nummer> · 29.10.2026 · Auftrag: Noah «1a 2a 3a 4a» (Thread «Videos in der App einschätzen», Schritt 3 von 6)

## Was ist neu
- Ein Link zu einer Videoseite (YouTube, Vimeo, Dailymotion, TikTok oder eine Adresse mit /video) in einer Notiz zeigt ein Abspiel-Symbol und «Video-Link: das Video bleibt, wo es ist». Andere Links bleiben wie bisher.
- Ein Video über 1 Minute sagt jetzt dazu: im Handy lassen und den Link unter «Link» hinzufügen.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Erkannt wird mit der Liste der Videoseiten aus «Inspiration» (`detectType`), damit es nur eine Liste gibt.
- Kein Video wird geladen oder gespeichert: die Notiz hält nur die Adresse (0 Kosten, kein Speicher).
- Kein Dexie-Schema, kein `api/`.

## Entscheide (für decisions.md)
- 29.10.2026: Video-Link = Schritt 3 der Video-Reihe (Noah «2a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Videos: Schritt 3 von 6.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Notizen › eine Notiz › «Link»: eine YouTube-Adresse hinzufügen.
2. Der Link zeigt ein Abspiel-Symbol und «Video-Link: das Video bleibt, wo es ist».
3. Eine gewöhnliche Adresse hinzufügen: sie bleibt ein gewöhnlicher Link.
