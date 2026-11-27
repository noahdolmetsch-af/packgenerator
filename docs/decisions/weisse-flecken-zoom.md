# Weisse Flecken: Zoom und Namen

- 27.11.2026, Noah: «karte zoombar. gibt es dazu bereits bilder?» zur Karte «Weisse Flecken in der Nähe» (Touren › Träume): auch diese Karte wird zoombar, mit derselben Bedienung wie die Karte in Neuland. Bilder vor dem Merge (Freigabe über die Karte «Freigeben»).
- 27.11.2026, Noah: «bei mouseover erscheint der name der gemeinde / kanton»: auf den Karten von Weisse Flecken, Neuland und Gipfelbuch zeigt die Maus beim Darüberfahren den Namen (nur mit der Maus; auf dem Handy gibt es kein Darüberfahren, dort öffnet ein Tipp wie bisher).
- Umsetzung (Selbst entschieden): gemeinsamer Zoom-Zustand `src/lib/neuland/kartezoom.svelte.js` und Rahmen `ZoomBox.svelte` für die Karte der Weissen Flecken; die Neuland-Karte behält ihre eigene Bedienung (`NeulandMap.svelte`), beide nutzen `kartezoom.js` und `MapTip.svelte`.
