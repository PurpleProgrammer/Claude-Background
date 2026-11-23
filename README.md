# Interactive Background for Claude

**English** · [Deutsch](README.de.md)

[![Check](https://github.com/PurpleProgrammer/claude-background/actions/workflows/check.yml/badge.svg)](https://github.com/PurpleProgrammer/claude-background/actions/workflows/check.yml)

![A snowman cheering in a snowy night after passing tests](docs/images/hero.gif)

A living background for the Claude app (desktop and mobile): a simple landscape that follows your session, the seasons and the calendar.

- **Context:** the fuller the context, the more snow (or leaves, petals) falls. The figure puts on a hat at 25 %, a scarf at 50 % and a broom with mittens at 75 %.
- **Model:** the current model and how full the context is are shown top right. Each model has its own weather: Opus clear, Sonnet sunset (northern lights at night), Haiku fog, Fable magic (twinkling stars and shooting stars on a lilac sky).
- **Moods:** passing tests make the figure cheer (arms up, hopping, confetti). Failing tests and errors give it a fright (wide eyes, hat pops up, a red “!”).
- **Click the background:** a flurry, snow falls off the fir trees, and the moon or sun smiles.
- **Seasons with smooth transitions:** the snowman is built in November and melts in March. Flowers bloom in spring, and a scarecrow takes over in summer and autumn.
- **Occasions and costumes:** 17 occasions, each with its own decoration, and the figure dresses up for many of them.

| Occasion | Date | Decoration | Costume |
|---|---|---|---|
| Valentine's Day | 14 Feb | rising hearts | a rose |
| Carnival | by town (Basel, Bern, Lucerne and the rest) | confetti and streamers | jester's hat |
| International Women's Day | 8 Mar | mimosa, violet bunting | a mimosa sprig |
| Easter | Good Friday to Easter Monday | eggs and a rabbit | bunny ears |
| Sechseläuten | 3rd Monday in April, Zurich only | the Böögg on its pyre | |
| Labour Day | 1 May | a maypole | |
| Mother's Day | 2nd Sunday in May | tulips | a bouquet |
| Ascension Day | Easter + 39 days | a hot-air balloon | |
| Pentecost | Whit Sunday and Monday | a dove and peonies | |
| Midsummer | 21 Jun | sunflowers, fireflies at night | sunglasses |
| Swiss National Day | 31 Jul to 1 Aug | flag, lanterns, bonfire, fireworks | a Swiss flag |
| Halloween | 30 to 31 Oct | jack-o'-lanterns and bats | witch's hat |
| St Nicholas Day | 6 Dec | a sack with mandarins and nuts | mitre and beard |
| Advent | 1 to 23 Dec | lights on the fir tree | |
| Christmas | 24 to 26 Dec | star, lights and presents | Santa hat |
| New Year's Eve, New Year | 31 Dec, 1 Jan | fireworks, a greeting | party hat |

## Gallery

**Seasons and weather per model**

![Winter, thaw, spring, summer, autumn and a Fable winter night](docs/images/seasons.png)

**Occasions and costumes**

![All occasions with their decorations and costumes](docs/images/occasions.png)

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

## Preview with `/backdrop`

`/winter` is a short form and does the same. (`/background` is taken by the app itself.)

| Command | Effect |
|---|---|
| `/backdrop` | show the current state |
| `/backdrop summer` | preview a season: `winter`, `firstsnow`, `thaw`, `spring`, `summer`, `autumn` |
| `/backdrop halloween` | preview an occasion: `valentine`, `carnival`, `womensday`, `easter`, `sechselaeuten`, `labourday`, `mothersday`, `ascension`, `pentecost`, `midsummer`, `nationalday`, `halloween`, `stnicholas`, `advent`, `christmas`, `newyearseve`, `newyear` |
| `/backdrop date 2027-03-20` | any date |
| `/backdrop weather magic` | weather `clear`, `sunset`, `fog` or `magic` |
| `/backdrop context 80` | simulate how full the context is |
| `/backdrop cheer` · `/backdrop fright` | let the figure cheer or get a fright |
| `/backdrop falling burst` | snow and leaves fall only for a few seconds after each change; `always` or `off` also work, and your choice is remembered |
| `/backdrop reset` | end all previews |

## Customising

Every setting is in [`hooks/settings.ts`](hooks/settings.ts), with a comment for each:

- `language`: `'en'` or `'de'` for all texts in the scene and in `/backdrop`
- `label`: top right or top left, and the distance from the window's edges
- `layout`: where the figure and the moon stand, as a share of the window's width
- `falling`: whether things fall always, for a few seconds after each change, or never
- `location`: your town (`zurich`, `basel`, `bern`, `lucerne` or `other`) for carnival dates and Sechseläuten
- `costumes`: whether the figure dresses up on occasions
- number of fir trees and size of the figure
- colours of hat, pompom, scarf, mittens and broom
- the context stages for the accessories
- how many flakes fall with an empty and a full context
- weather per model
- how long click effects and moods last, and whether any error startles the figure
- which occasions are shown
- calendar dates for the first snow and the thaw

## Development

Every push and pull request runs `claude plugin validate .` and `claude plugin test .` on GitHub Actions ([workflow](.github/workflows/check.yml)). The badge at the top shows the latest result.

## Credits

`hooks/make-colors.js` and `hooks/make-colors.d.ts` are copied unchanged from the Claude Code plugin-authoring kit, which provides them for mods to include. They remain under their original terms.

## License

[MIT](LICENSE)
