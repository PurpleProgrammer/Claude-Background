# Changelog

All notable changes to Interactive Background for Claude.

## 1.1.1

- Technical notices (no app drawing themes yet, a command name already taken) go to the debug log instead of the status line and the chat

## 1.1.0

- A second landscape, the Alps: `/backdrop landscape mountains` (or `landscape: 'mountains'` in the settings)
  - an ibex as the figure, climbing its rock as the context fills, with a cap between its horns, a scarf, and a backpack with a rope at 75 %; it wears the occasions' costumes and cheers or startles like the snowman
  - the snowline on the peaks follows the seasons; cows with bells graze on the alp in spring and summer
  - sunset weather turns into Alpenglühen on the snow, fog lies as a sea of fog between the peaks
  - bonfires on the summits on 1 August; a click sends an eagle across and puffs up a little snow slide
- Landscape-specific drawing lives in `hooks/landscapes/`; weather, occasions, label and commands stay shared

## 1.0.0

First public release.

- The model and context label sits just above the figure, so panels that fold in on the right no longer cover it (`label.position`; the top corners are still available)
- Releases are created automatically on GitHub when the version changes (`.github/workflows/release.yml`)
- Everything from the versions below: regions and around 60 occasions from many countries and cultures, seasons in both hemispheres, five languages, moods, click effects, falling modes and the `/backdrop` command

## 0.8.0

- `/backdrop language fr` switches the language of the texts and remembers it; `auto` follows the system again
- `/backdrop` reminds you how to end a preview while one is on
- A country chosen by hand counts its days in its main time zone (America/New_York for the US, not America/Adak)
- The gallery shows occasions from many countries; Hanukkah and Kwanzaa candles are larger

## 0.7.0

- Regions: the mod detects the country from the system's time zone and locale, without network access; settings `region`, `subdivision`, `timeZone`, `hemisphere`, `snow` and `extraOccasions`; `/backdrop region` and `/backdrop occasions`
- Around 60 occasions from many countries and cultures, as data in `hooks/occasions.ts`, with dates from Intl calendars and sourced tables
- Seasons mirror in the southern hemisphere; `snow: false` for places without snow
- Five languages: English, German, French, Italian and Spanish, with regional variants and Intl date and number formats
- Switzerland keeps exactly its former occasions, checked day by day

## 0.6.0

- Falling mode `freeze`: things stop in mid-air at the frame they reached
- `/backdrop figure` and `/backdrop moon` move them and remember it

## 0.5.0

- Figure and moon stand beside the conversation, as a share of the window width
- Falling modes `always`, `burst` and `off`
- The command is `/backdrop` (`/background` is built into the app)

## 0.4.0

- Renamed to Interactive Background for Claude
- Seven more occasions (Valentine's Day, carnival, Sechseläuten, Mother's Day, Ascension, midsummer, St Nicholas) and costumes for the figure
- New gallery and hero GIF

## 0.3.0

- Fable gets its own weather; International Women's Day, Labour Day, Pentecost and Halloween
- The label is pinned to a top corner in screen pixels

## 0.2.0

- Code, settings and docs in English, German as the second language
- The figure cheers after passing tests and gets a fright after errors
- MIT license

## 0.1.0

- Winter landscape: snowfall and a snowman that follow the context, the model shown in the scene, clicks, seasons with transitions, occasions and a settings file
