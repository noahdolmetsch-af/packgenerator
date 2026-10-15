/**
 * All German texts, merged from one file per part of the app (keys are the English texts).
 */
import shell from './shell.js';
import gear from './gear.js';
import pack from './pack.js';
import bikes from './bikes.js';
import ride from './ride.js';
import common from './common.js';
import tips from './tips.js';
import care from './care.js';
import setup from './setup.js';
import evening from './evening.js';
import schedule from './schedule.js';
import drafts from './drafts.js';
import importgear from './importgear.js';
import whatsnew from './whatsnew.js';
import backpacks from './backpacks.js';
import merge from './merge.js';
import today from './today.js';
import templates from './templates.js';
import calm from './calm.js';
import gpx from './gpx.js';
import wardrobe from './wardrobe.js';
import weigh from './weigh.js';
import review from './review.js';
import home from './home.js';
import rueckblick from './rueckblick.js';
import pflege from './pflege.js';
import flow from './flow.js';
import fix0691 from './fix0691.js';
import feinschliffMaterial from './feinschliff-material.js';
import blocks from './blocks.js';
import masse from './masse.js';
import tempo from './tempo.js';
import uebergaenge from './uebergaenge.js';
import fix0671 from './fix0671.js';
import kmbook from './kmbook.js';
import blaetter from './blaetter.js';
import orte from './orte.js';
import orte2 from './orte2.js';
import blaetter2 from './blaetter2.js';
import feinschliff from './feinschliff.js';
import heuteruhig from './heuteruhig.js';
import helfer from './helfer.js';
import hobby from './hobby.js';
import hobby2 from './hobby2.js';
import hobby3 from './hobby3.js';
import ausstattung from './ausstattung.js';
import medeinfach from './medeinfach.js';
import aufraeumen from './aufraeumen.js';
import medwunsch from './medwunsch.js';
import rueckblickantippen from './rueckblickantippen.js';
import allesfinden from './allesfinden.js';
import kachel from './kachel.js';
import velokurz from './velokurz.js';
import look from './look.js';
import head from './head.js';
import heute2 from './heute2.js';
import challenge from './challenge.js';
import material2 from './material2.js';
import touren2 from './touren2.js';
import velo2 from './velo2.js';
import packen2 from './packen2.js';
import aktiv2 from './aktiv2.js';
import ich2 from './ich2.js';
import rueckblick2 from './rueckblick2.js';
import wasneu2 from './wasneu2.js';
import strava from './strava.js';

// v0.111.0 Bausteine bearbeiten: evening-before and after-trip check
import checks from './checks.js';
import rahmen from './rahmen.js';
// v0.117.0 Knöpfe neu: short labels and what each button does
import knoepfe from './knoepfe.js';
// v0.118.0 Was ist neu 2 and KI-Helfer ausblenden
import wasneu3 from './wasneu3.js';
import kiaus from './kiaus.js';
// v0.119.0 Schnellstart: one click on Heute plans a trip
import schnellstart from './schnellstart.js';
import teil2 from './teil2.js';
// v0.125.0 A-J1: one way to record a workshop visit
import aj1 from './aj1.js';
// v0.125.0 TZ-1 «Zustand sichtbar»: the three trip states
import tz1 from './tz1.js';
// TZ-2 «Fest nach der Fahrt»: the fixed list, «Wieder öffnen», «Bist du gefahren?»
import tz2 from './tz2.js';
import au from './au.js';
// SN1 Unterwegs and SN6 Funktionen (mockup round «Seiten neu»)
import sna from './sna.js';
// SN2 + SN4 «Seiten neu»: Rückblick, Logbuch, Dein Tempo, Vergangene Touren
import snb from './snb.js';
// SN3, SN5, SN7 «Seiten neu»: Vorlagen, Bausteine, Import prüfen, Favoriten, the old windows
import snc from './snc.js';
// SN2+ «SN2 plus»: Puls und Leistung, Aus Vorlage, Logbuch-Filter, Tempo pro Velo und Untergrund, die Monate
import sn2plus from './sn2plus.js';
// SN4+ «SN4 plus»: Vergangene Touren mit Strava-Spalten, «Spalten» und «In Zahlen»
import sn4plus from './sn4plus.js';
// SN3+ «Bausteine je nach Lage»: the seven blocks with a rule, the suggestion in Packen, pass / country / getting there
import sn3plus from './sn3plus.js';
// SN2x «SN2 extra»: the whole Rückblick of one trip (groups, day switch, Puls und Leistung, U2–U6, Vergleich)
import sn2x from './sn2x.js';
// Data cleanup 14.10.2026: old fields and personal lists out of the code
import datenbereinigen from './datenbereinigen.js';

// Bugfix Dateneingabe D1–D4: values on the Pick-up check, «Enter values», own fields
import dateneingabe from './dateneingabe.js';
// v0.123.0 Trophäen-Vitrine: all stars by area and year
import vitrine from './vitrine.js';
// SK «Seiten-Kacheln» and «Links nach aussen»: the tiles at the page end, the links elsewhere, own links
import sk from './sk.js';
// SN5+ «SN5 plus»: Favoriten (bar, zuletzt dabei, Oft dabei, Als Baustein) and Import prüfen (weight, bag, Schon da, Letzte Importe)
import sn5plus from './sn5plus.js';
// SN4g–SN4i «Touren-Seite, Runde 2»: Band Packmodus, Geplant, Werte pro Tour, Filter FL1–FL8, alles offen, drei Kacheln
import sn4g from './sn4g.js';

// SN1b–SN1d «Tour aus komoot»: the row on Unterwegs and in «Neue Tour», the sheet, «In komoot öffnen»
import komoot from './komoot.js';

// SN6+ «SN6 plus»: Funktionen with progress, Passt gerade, Deine Top 5, Neu seit deinem letzten Besuch, So geht's
import sn6plus from './sn6plus.js';

// AB «Deine Abfragen»: the 50 questions in 10 areas, Ich › Deine Abfragen, the card on Heute, Ich › Daten › Verlauf
import abfragen from './abfragen.js';

// FE1, FE13, FE14, FE16: Daumen-Zone, Farbe nie allein, «?» an Ort und Stelle, passende Handy-Tastatur
import daumen from './daumen.js';

// HG1 «Begrüssung auf Heute»: the name question, «Dein Name» in Ich › Darstellung, the sheet behind the greeting
import hg1 from './hg1.js';

// v0.127.0 «Tages-Check» 1: morning check and evening review
import tagescheck from './tagescheck.js';
// v0.127.0 «Tages-Check» 2: the balance ring, the tiles, the 15 questions
import tagescheck2 from './tagescheck2.js';
import woche from './woche.js';
import sporttasche from './sporttasche.js';
import erholung from './erholung.js';

// «Werte überall» WU1–WU4 and «Strava verbinden» SV1
import werte from './werte.js';
// «App-Wartung» BF4 BF7 BF8: backup before updates, Strava free limits, the monthly check
import wartung from './wartung.js';
// Bedienung (Noah 13.10.2026): FE2 FE6 FE7 FE8 FE9 FE10 FE11 FE17 FE18
import bedienung from './bedienung.js';
// Kluge Suche: similar words, typos, filters, «Für Claude kopieren», Chrome-KI
import kisuche from './kisuche.js';
// UC3 Velos › Setup: photos, total weight, bag plan, setup log, ideas from others
import setuprig from './setuprig.js';
// Ich › Bezahlen (mockups BZ1 + BZ2b)
import bezahlen from './bezahlen.js';
// Kleine Apps: Meditation, Packliste, Velopflege with their own icon
import kleineapps from './kleineapps.js';
// Benutzerhandbuch: how to switch on and use every function (src/lib/handbook.js)
import handbuch from './handbuch.js';
// WG «Wi gaht's?» takes over the daily check: the round tile, «Feste Runden», the rows in Im Flow
import runden from './runden.js';
// KT «Kacheln antippbar»: «Öffnen ›», «•••» and the help line, the short intro of the start page
import kacheln from './kacheln.js';
// «Inhalte Flow» IF1–IF3: tip line, fold «Das kann die App hier», tiles «Weiter»
import pageinfo from './pageinfo.js';

// Kamera-Knopf: one tap opens the camera, always for receipts
import kamera from './kamera.js';

// «Inspiration» UC2-1, UC2-2, UC2-4: your own links, «Aus der Notiz wird …», the packing hint
import inspiration from './inspiration.js';

// v0.134.0 «Listen und Typen» (LI1–LI4)
import lists from './lists.js';

// «Timer» (Z1–Z5) and «Meditation» (ME1–ME3)
import timer from './timer.js';
import meditationzentral from './meditation-zentral.js';

// Durchklick: «fällig» counts the same everywhere
import durchklick from './durchklick.js';

// «Training» TR1–TR4: Strava activities, heart rate zones, week plan
import training from './training.js';

// Ich › Bezahlen › Rechnungen: QR bill and TWINT (mockups QR1–QR9)
import rechnungen from './rechnungen.js';

// «Leistung und Analysen» TR5–TR7: power, weight, analyses on the activity and in the week
import leistung from './leistung.js';
import leistungAktivitaet from './leistung-aktivitaet.js';
import leistungAnalysen from './leistung-analysen.js';
import gewicht from './gewicht.js';
import leistungWoche from './leistung-woche.js';

// «Mehr Inhalt» Training T1–T5 and Wochenrückblick W1–W6
import trainingInhalt from './training-inhalt.js';

export default { ...blocks, ...flow, ...home, ...today, ...care, ...ride, ...bikes, ...gear, ...pack, ...shell, ...common, ...tips, ...setup, ...evening, ...schedule, ...drafts, ...importgear, ...whatsnew, ...backpacks, ...merge, ...templates, ...calm, ...gpx, ...wardrobe, ...weigh, ...review, ...rueckblick, ...tempo, ...pflege, ...masse, ...uebergaenge, ...fix0671, ...kmbook, ...blaetter, ...fix0691, ...blaetter2, ...heuteruhig, ...feinschliffMaterial, ...feinschliff, ...orte, ...helfer, ...orte2, ...hobby, ...hobby2, ...hobby3, ...ausstattung, ...medeinfach, ...aufraeumen, ...rueckblickantippen, ...medwunsch, ...kachel, ...velokurz, ...allesfinden, ...look, ...head, ...heute2, ...challenge, ...material2, ...touren2, ...velo2, ...packen2, ...aktiv2, ...ich2, ...rueckblick2, ...wasneu2, ...checks, ...rahmen, ...strava, ...knoepfe, ...wasneu3, ...kiaus, ...schnellstart, ...dateneingabe, ...vitrine, ...teil2, ...tagescheck, ...tagescheck2, ...woche, ...sporttasche, ...erholung, ...aj1, ...tz1, ...au, ...werte, ...wartung, ...bedienung, ...kisuche, ...setuprig, ...bezahlen, ...kleineapps, ...handbuch, ...datenbereinigen, ...sna, ...snb, ...tz2, ...snc, ...sn2plus, ...sn4plus, ...sn3plus, ...sn2x, ...sk, ...sn5plus, ...sn4g, ...komoot, ...sn6plus, ...abfragen, ...daumen, ...hg1, ...runden, ...kacheln, ...kamera, ...inspiration, ...lists, ...timer, ...meditationzentral, ...pageinfo, ...durchklick, ...training, ...rechnungen, ...leistung, ...leistungAktivitaet, ...leistungAnalysen, ...gewicht, ...leistungWoche, ...trainingInhalt };
