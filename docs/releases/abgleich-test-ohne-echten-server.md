# Abgleich-Test fragt nie mehr den echten Server

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «oder mach einfach das beste» (Thread «Verbessern Weg von gebaut zu online»), Anlass: #305 rot

## Was ist neu
- Nichts in der App. Ein Browsertest (`tests/e2e/abgleich.spec.js`, «Pairing … an error shows in the panel») hat beim Ausschalten des Abgleichs eine noch laufende Anfrage an den echten Server «packgen» weitergeschickt. Der echte Server hatte am 27.10.2026 abends seine Tagesgrenze erreicht. Deshalb zeigte der Test «Gratis-Grenze» statt «Gerade kein Netz» und war rot, obwohl der PR nichts damit zu tun hatte (#305).
- Neu wartet der Test, bis die laufende Anfrage beim Test-Server fertig ist. Erst dann schaltet er das Netz ab. Kein Test-Aufruf erreicht mehr den echten Server.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Test prüft weiter dasselbe (kein Netz → Hinweis im Feld). Er ist nicht gelockert, nur die Reihenfolge stimmt jetzt.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- Verschlanken (Tests und Tempo): ein zufällig roter Test weniger.

## Prüfschritte (nach dem Merge)
1. Nichts in der App anzuschauen.
2. Unter github.com/noahdolmetsch-af/packgenerator/actions sind die nächsten PRs bei «e2e (phone)» grün, auch wenn der echte Server an der Tagesgrenze ist.
