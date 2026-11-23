# Interactive Background for Claude

**English** · [Deutsch](README.de.md)

[![Check](https://github.com/PurpleProgrammer/claude-background/actions/workflows/check.yml/badge.svg)](https://github.com/PurpleProgrammer/claude-background/actions/workflows/check.yml)

![A snowman cheering in a snowy night after passing tests](docs/images/hero.gif)

A living background for the Claude app (desktop and mobile): a simple landscape that follows your session, the seasons and the calendar where you live.

- **Context:** the fuller the context, the more snow (or leaves, petals) falls. The figure puts on a hat at 25 %, a scarf at 50 % and a broom with mittens at 75 %.
- **Model:** the current model and how full the context is are shown just above the figure. Each model has its own weather: Opus clear, Sonnet sunset (northern lights at night), Haiku fog, Fable magic (twinkling stars and shooting stars on a lilac sky).
- **Moods:** passing tests make the figure cheer (arms up, hopping, confetti). Failing tests and errors give it a fright (wide eyes, hat pops up, a red “!”).
- **Click the background:** a flurry, snow falls off the fir trees, and the moon or sun smiles.
- **Seasons with smooth transitions:** the snowman is built in November and melts in March. Flowers bloom in spring, and a scarecrow takes over in summer and autumn. In the southern hemisphere the seasons are mirrored.
- **Occasions and costumes:** around 60 occasions from many countries and cultures, each with its own decoration, and the figure dresses up for many of them.
- **Five languages:** English, German, French, Italian and Spanish.

## Gallery

**Seasons and weather per model**

![Winter, thaw, spring, summer, autumn and a Fable winter night](docs/images/seasons.png)

**Occasions and costumes**

![Occasions with their decorations and costumes](docs/images/occasions.png)

**Accessories as the context fills, and the moods**

![The snowman at 10, 25, 50 and 75 percent context, cheering and startled](docs/images/stages-moods.png)

## Installation

At the prompt of a Claude Code terminal session:

```
/plugin install interactive-background --marketplace PurpleProgrammer/claude-background
```

Then press `y` to add the marketplace and Enter to choose the scope.

From a shell:

```bash
claude plugin install interactive-background --marketplace PurpleProgrammer/claude-background
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `PurpleProgrammer/claude-background`, then **Add plugin**.

The background shows in the desktop and mobile apps. The terminal draws no background. In portrait on a phone only the middle of the landscape fits.

## Regions & occasions

The mod works out where you are from your system's time zone and locale, without any network access, and shows the occasions of that country. `/backdrop` tells you what it detected, for example `Region: CH (detected via Europe/Zurich)`. Anything you set by hand wins.

> **Cloud sessions:** a cloud machine usually reports `UTC` and `en-US`, so it is detected as the United States. Run `/backdrop region CH` (with your own country code) once; the choice is remembered, and the days are then counted in that country's time zone.

| Occasions | Shown in |
|---|---|
| New Year's Eve, New Year, Valentine's Day, International Women's Day, Halloween, summer solstice (21 June north, 21 December south) | everywhere |
| Easter, Advent, Christmas | Europe, the Americas, Oceania and other countries where they are public holidays |
| Orthodox Easter | GR, CY, RO, BG, RS, UA, RU, GE, MK, ME, BA, ET |
| Carnival | CH (dates by town), DE, AT, BE, NL, LU, LI, IT, ES, PT, BR (Saturday to Tuesday) … |
| Ascension, Pentecost | CH, LI, DE, AT, FR, BE, NL, LU, DK, NO, SE, FI |
| Mother's Day, Father's Day | by country (2nd Sunday in May, Mothering Sunday, last Sunday in May in France, 10 May in Mexico …) |
| Epiphany, St Patrick's Day, St Martin, St Nicholas (5 December in NL and BE), St Lucy, Midsummer, Boxing Day | the countries that keep them |
| National days | CH, DE, AT, LI, FR, IT, ES, NL, US, CA, MX, BR, NZ, IN, PL, UA, NO; Australia Day only when switched on |
| Thanksgiving, Labor Day in September | US, CA |
| Guy Fawkes Night | GB |
| Day of the Dead | MX |
| Children's Day, Tanabata, cherry blossom season | JP |
| Lunar New Year, Mid-Autumn Festival | CN, TW, HK, MO, SG, MY, VN (Lunar New Year also KR) |
| Nowruz | IR, AF, AZ, TJ, KZ, UZ, KG, TM |
| Ramadan, Eid al-Fitr, Eid al-Adha | countries with a Muslim majority |
| Hanukkah | IL |
| Diwali, Holi, Vesak | IN, NP and others (from published calendars 2026–2036; years without a firm date are left out) |
| Kwanzaa | only with `extraOccasions` |

Sechseläuten appears with `subdivision: 'CH-ZH'`. `/backdrop occasions` lists the occasions of your region with their next date.

Islamic dates follow the Umm al-Qura calendar and can differ by a day from the day observed where you live.

### Settings for regions

| Setting | Values | What it does |
|---|---|---|
| `region` | `'auto'` or a country code (`'CH'`, `'DE'`, `'US'` …) | whose occasions are shown |
| `subdivision` | `''` or e.g. `'CH-ZH'`, `'CH-BS'`, `'CH-BE'`, `'CH-LU'` | local customs such as carnival dates and Sechseläuten (never guessed) |
| `timeZone` | `'auto'` or e.g. `'Europe/Zurich'` | which calendar day counts |
| `hemisphere` | `'auto'`, `'north'`, `'south'` | which way the seasons run |
| `snow` | `true` / `false` | `false`: no snowman, a summer figure all year, rain in winter |
| `extraOccasions` | list of occasion ids | occasions from other regions or cultures as well |
| `occasions` | `true` / `false` per occasion | switch single occasions on or off |

Example: in Switzerland, also see Diwali and Hanukkah, but no Halloween:

```ts
region: 'CH',
subdivision: 'CH-ZH',
extraOccasions: ['diwali', 'hanukkah'],
occasions: { ..., halloween: false },
```

### Add a country

Pull requests are welcome. A new country usually needs only:

1. **One entry** in [`hooks/occasions.ts`](hooks/occasions.ts): add the country code to an existing occasion's `regions` (or to a group such as `CHRISTMAS`), or add a new entry with its `days` rule. A national day only needs its colours in `NATIONAL_COLORS` in [`hooks/decor.ts`](hooks/decor.ts).
2. **Its name in every language** in [`hooks/i18n.ts`](hooks/i18n.ts); the type check fails while one is missing.

Dates that `Intl` cannot compute come from published calendars, with the source in a comment. Please do not estimate them.

## Languages

Set `language` in [`hooks/settings.ts`](hooks/settings.ts) to `'en'`, `'de'`, `'fr'`, `'it'`, `'es'`, or `'auto'` for the language of your system, or switch it with `/backdrop language de`. Names that differ by country are handled too (for example “Labor Day” in the US, “Fête nationale” in French-speaking Switzerland). Another language is welcome as a pull request: one more `Texts` object and its words in `WORDS`.

## Commands

`/backdrop` (short form `/winter`; `/background` is taken by the app itself). The words work in all five languages, accents optional.

| Command | Effect |
|---|---|
| `/backdrop` | show the current state, including the region and where it was detected from |
| `/backdrop summer` | preview a season: `winter`, `firstsnow`, `thaw`, `spring`, `summer`, `autumn` |
| `/backdrop halloween` | preview an occasion by its id or name, e.g. `easter`, `diwali`, `thanksgiving`, `lunarnewyear`, `kingsday` |
| `/backdrop date 2027-03-20` | any date |
| `/backdrop weather magic` | weather `clear`, `sunset`, `fog` or `magic` |
| `/backdrop context 80` | simulate how full the context is |
| `/backdrop cheer` · `/backdrop fright` | let the figure cheer or get a fright |
| `/backdrop falling burst` | snow and leaves fall only for a few seconds after each change, then the sky clears |
| `/backdrop falling freeze` | the same, but everything stops in mid-air; `always` and `off` also work, and your choice is remembered |
| `/backdrop figure 20` · `/backdrop moon 85` | move the figure or the moon (percent of the window width); `/backdrop layout reset` goes back to the settings |
| `/backdrop region DE` · `/backdrop region auto` | show another country's occasions and remember it, or detect it again |
| `/backdrop occasions` | list the occasions of your region with their next date |
| `/backdrop language fr` · `/backdrop language auto` | switch the language of the texts and remember it, or follow the system again |
| `/backdrop reset` | end all previews and go back to today (`/backdrop` reminds you while a preview is on) |
| `/backdrop help` | the help, in your language |

## Customising

Every setting is in [`hooks/settings.ts`](hooks/settings.ts), with a comment for each: language, label position (above the figure or a top corner), layout, falling mode, region settings (above), costumes, number of fir trees and size of the figure, colours of the accessories, context stages, number of flakes, weather per model, how long click effects and moods last, occasions, and the calendar of the first snow and the thaw.

## Development

Every push and pull request runs `claude plugin validate .` and `claude plugin test .` on GitHub Actions ([workflow](.github/workflows/check.yml)). A release is created automatically when `main` carries a new version in `.claude-plugin/plugin.json`, with that version's section of `CHANGELOG.md` as notes ([workflow](.github/workflows/release.yml)). The badge at the top shows the latest result. The tests include a day-by-day check that Switzerland keeps exactly the occasions it had before regions existed.

The time zone table `hooks/zones.ts` is generated from the IANA database with `node scripts/make-zones.mjs`.

## Changes

What changed in each version: [CHANGELOG.md](CHANGELOG.md).

## Credits

`hooks/make-colors.js` and `hooks/make-colors.d.ts` are copied unchanged from the Claude Code plugin-authoring kit, which provides them for mods to include. They remain under their original terms.

## License

[MIT](LICENSE)
