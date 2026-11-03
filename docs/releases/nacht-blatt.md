# Nacht-Blatt auf der Live-Karte

PR (diese Änderung) · 02.11.2026 · Noah «4a» der Liste «Ursprünglich geplant» und «1b» (nur auf Wunsch öffnen), Ziel 6 «Lange Fahrten unterwegs verstehen»

## Was ist neu
- Im «⋯»-Menü der Live-Karte neu «Nacht-Blatt» (`NightSheet.svelte`): eine ruhige Seite, die nur zeigt.
- Inhalt: Weiterfahren oder schlafen (nur im Rennen) als Ampel (grün, gelb, rot) mit einem Satz in einfachen Worten, den Gründen, «Wie müde bist du?» in fünf Stufen, «Warum dieser Vorschlag?» und dem Nickerchen-Timer des Rennmodus, das Bett vor dir, der letzte offene Laden (Rechnung aus «Letzter offener Laden»), «Heute bisher» (Fahrzeit und Stillstand) und die drei Ziele, die man mit dem Stift gleich im Blatt ändert (auch unter Vorbereiten).
- Noah 02.11. 20:50: «Entscheid für Nutzer unverständlich, Ziele pflegen» → Ampel mit Satz, Müdigkeit im Blatt, Stift für die Ziele (Mockup freigegeben mit «a»). Hotel ändern und Hinnavigieren folgen als eigener PR.
- Ohne Rennen zeigt es Bett, Laden und heute; ohne geschriebene Ziele steht, wo man sie schreibt.

## Was fällt weg oder rutscht tiefer
- nichts. Ein Eintrag mehr im «⋯»-Menü.

## Selbst entschieden
- Das Blatt öffnet nie von selbst (Noah «1b»).
- Es benutzt die Rechnungen des Rennmodus (`rideOrSleep`); die Müdigkeit kommt aus den Einträgen im Rennmodus, Standard «2».

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben «Nacht-Blatt auf der Live-Karte» (vorhaben-liste.md) gebaut; danach Schritt 6 «Offline» der Live-Navigation.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Karte starten, «⋯» › «Nacht-Blatt»: Bett, Laden und «Heute bisher» stehen da.
2. In einem Rennen mit geschriebenen Zielen steht auch «Drei Ziele» im Blatt.
