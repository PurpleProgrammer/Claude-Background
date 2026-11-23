# Winterlandschaft

Ein Hintergrund für die Claude-App (Desktop und Mobil): eine schlichte Landschaft, die auf deine Sitzung reagiert.

- **Kontext:** Je voller der Kontext, desto dichter fällt der Schnee. Der Schneemann bekommt ab 25 % eine Mütze, ab 50 % einen Schal und ab 75 % Besen und Fäustlinge.
- **Modell:** Oben links steht das aktuelle Modell mit dem Kontext-Füllstand. Jedes Modell hat sein eigenes Wetter: Opus klar, Sonnet Abendrot (nachts Nordlicht), Haiku Nebel.
- **Klick auf den Hintergrund:** Schneegestöber, Schnee rieselt von den Tannen, Mond oder Sonne lächelt.
- **Jahreszeiten mit Übergängen:** Im November wird der Schneemann gebaut, im März schmilzt er. Im Frühling blühen Blumen, im Sommer und Herbst steht eine Vogelscheuche.
- **Anlässe:** Ostern, 1. August, Advent, Weihnachten, Silvester und Neujahr.

## Installation

In einer Terminal-Sitzung von Claude Code:

```
/plugin install winterlandschaft --marketplace PurpleProgrammer/claude-background
```

Danach `y` drücken, um den Marketplace hinzuzufügen, und mit Enter den Bereich wählen.

Aus einer Shell:

```bash
claude plugin install winterlandschaft --marketplace PurpleProgrammer/claude-background
```

In der Desktop-App, wo `/plugin` nicht läuft: auf **+** neben dem Eingabefeld klicken, dann **Plugins**, **Add marketplace** mit `PurpleProgrammer/claude-background`, dann **Add plugin**.

Ist das Repository privat, klappt die Installation nur für Personen, die es auf GitHub lesen dürfen und auf deren Rechner bereits ein Git-Zugang für github.com eingerichtet ist (SSH-Schlüssel oder `gh auth login` und danach `gh auth setup-git`).

Der Hintergrund erscheint in der Desktop- und der Mobil-App. Im Terminal wird kein Hintergrund gezeichnet.

## Vorschau mit `/winter`

| Befehl | Wirkung |
|---|---|
| `/winter` | zeigt den aktuellen Zustand |
| `/winter ostern` | Jahreszeit oder Anlass ansehen: `winter`, `ersterschnee`, `schmelze`, `frühling`, `sommer`, `herbst`, `ostern`, `nationalfeiertag`, `advent`, `weihnachten`, `silvester`, `neujahr` |
| `/winter datum 2027-03-20` | beliebiges Datum |
| `/winter wetter nebel` | Wetter `klar`, `abendrot` oder `nebel` |
| `/winter kontext 80` | Kontext-Füllstand simulieren |
| `/winter zurück` | Vorschau beenden |

## Anpassen

Alle Einstellungen stehen mit Kommentaren in [`hooks/einstellungen.ts`](hooks/einstellungen.ts): Anzahl Tannen, Figurgrösse, Farben der Accessoires, Prozent-Stufen, Flockenmenge, Wetter je Modell, Dauer der Klick-Effekte, Anlässe und die Kalenderdaten für Schnee und Tauwetter.
