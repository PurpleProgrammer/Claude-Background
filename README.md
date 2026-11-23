# Winter Landscape

**English** · [Deutsch](README.de.md)

A background for the Claude app (desktop and mobile): a simple landscape that follows your session.

- **Context:** the fuller the context, the heavier the snowfall. The snowman puts on a hat at 25 %, a scarf at 50 % and a broom with mittens at 75 %.
- **Model:** the current model and how full the context is are shown top left. Each model has its own weather: Opus clear, Sonnet sunset (northern lights at night), Haiku fog.
- **Moods:** passing tests make the snowman cheer (arms up, hopping, confetti). Failing tests and errors give it a fright (wide eyes, hat pops up, a red “!”).
- **Click the background:** a snow flurry, snow falls off the fir trees, and the moon or sun smiles.
- **Seasons with smooth transitions:** the snowman is built in November and melts in March. Flowers bloom in spring, and a scarecrow takes over in summer and autumn.
- **Occasions:** Easter, Swiss National Day (1 August), Advent, Christmas, New Year's Eve and New Year.

## Installation

At the prompt of a Claude Code terminal session:

```
/plugin install winter-landscape --marketplace PurpleProgrammer/claude-background
```

Then press `y` to add the marketplace and Enter to choose the scope.

From a shell:

```bash
claude plugin install winter-landscape --marketplace PurpleProgrammer/claude-background
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `PurpleProgrammer/claude-background`, then **Add plugin**.

The background shows in the desktop and mobile apps. The terminal draws no background.

## Preview with `/winter`

| Command | Effect |
|---|---|
| `/winter` | show the current state |
| `/winter easter` | preview a season or occasion: `winter`, `firstsnow`, `thaw`, `spring`, `summer`, `autumn`, `easter`, `nationalday`, `advent`, `christmas`, `newyearseve`, `newyear` |
| `/winter date 2027-03-20` | any date |
| `/winter weather fog` | weather `clear`, `sunset` or `fog` |
| `/winter context 80` | simulate how full the context is |
| `/winter cheer` · `/winter fright` | let the figure cheer or get a fright |
| `/winter reset` | end all previews |

## Customising

Every setting is in [`hooks/settings.ts`](hooks/settings.ts), with a comment for each:

- `language`: `'en'` or `'de'` for all texts in the scene and in `/winter`
- number of fir trees and size of the figure
- colours of hat, pompom, scarf, mittens and broom
- the context stages for the accessories
- how many flakes fall with an empty and a full context
- weather per model
- how long click effects and moods last, and whether any error startles the figure
- which occasions are shown
- calendar dates for the first snow and the thaw

## Credits

`hooks/make-colors.js` and `hooks/make-colors.d.ts` are copied unchanged from the Claude Code plugin-authoring kit, which provides them for mods to include. They remain under their original terms.

## License

[MIT](LICENSE)
