import type { Register, ThemeSetArgs } from 'claude-code'

import { chooseRegion, occasionContext, region } from './context.js'
import { chooseLanguage, currentLanguage, helpFor, LANGUAGES, languageName, normalizeWord, t, WORDS, type CommandWord, type Language, type Season } from './i18n.js'
import { makeColors } from './make-colors.js'
import type { Occasion } from './i18n.js'
import { dayNumber, isActive, nextOccasionStart, OCCASIONS } from './occasions.js'
import { buildScene, yearState, type DateParts, type Mood } from './scene.js'
import { SETTINGS, type FallingMode, type LandscapeId, type Weather } from './settings.js'

const SCENE = 'winter'

// Cool, snowy grays by day and a blue winter night.
const { theme, problems } = makeColors({
  label: 'Interactive background',
  roles: { accent: '#2f6a9a', danger: '#b23a3a', success: '#3f7d55', warning: '#a8721a', pro: '#6a55a0' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e6eef5',
        'surface-1': '#eef4f9',
        'surface-2': '#f6f9fc',
        'text-primary': '#16212c',
        'text-secondary': '#3a4a5a',
        'text-muted': '#55657a',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0f1724',
        'surface-1': '#151f2e',
        'surface-2': '#1b2738',
        'surface-3': '#212e41',
        'text-primary': '#eaf1f8',
        'text-secondary': '#c3cfdc',
        'text-muted': '#9fb0c2',
      },
    },
  },
})

const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: SCENE, glass: { blur: 14, opacity: 0.55 } },
}

// What the scene draws from. A reload starts these over; session.start refills them.
let percent = 0
let modelId = ''
let today: DateParts = { y: 2026, m: 1, d: 1 }
let click: { x: number; y: number; seq: number } | undefined
let clickSeq = 0
let mood: Mood | undefined
let moodSeq = 0
let fallingMode: FallingMode = SETTINGS.falling.mode
// A landscape chosen with /backdrop landscape, else the setting.
let landscape: LandscapeId = SETTINGS.landscape
let falling = true
let fallSeq = 0
// Seconds the flakes have fallen in earlier bursts, so a new burst goes on from the frozen frame.
let fallShift = 0
let frozen = false
// Positions set with /backdrop figure and /backdrop moon (shares of the window width).
let layout: { figureX: number; moonX: number } | undefined

/** Commands that run tests. */
const TEST_COMMAND =
  /\b(npm|pnpm|yarn|bun)\s+(run\s+)?test\b|\bnpx\s+(jest|vitest|mocha|playwright\s+test)\b|(^|[\s;&|])(jest|vitest|pytest|mocha|rspec|phpunit|tox)\b|\b(cargo|go|dotnet|mix|deno|swift)\s+test\b|\bclaude\s+plugin\s+test\b|\bmake\s+(test|check)\b|\b(gradlew?|mvn)\s+\S*\s*test\b|\bpython3?\s+-m\s+(pytest|unittest)\b/

/** A test runner's summary that reports failures even where the exit code says nothing. */
const FAILED_SUMMARY = /\b[1-9]\d*\s+(failed|failing|failures?|errors?)\b|\bFAIL(ED)?\b/

// Previews set with /winter; they last until /winter reset or a reload.
const preview: { date?: DateParts; weather?: Weather; percent?: number; occasion?: Occasion } = {}

/** "claude-opus-5-5" -> "Opus 5.5"; anything else stays as it is. */
function prettyModel(id: string): string {
  const m = /claude-([a-z]+)-(\d+)-(\d+)/i.exec(id)
  if (m === null) {
    return id
  }
  const family = m[1] ?? ''
  const name = family.charAt(0).toUpperCase() + family.slice(1).toLowerCase()

  return `${name} ${m[2] ?? ''}.${m[3] ?? ''}`
}

function weatherFor(id: string): Weather {
  const low = id.toLowerCase()
  for (const [key, w] of Object.entries(SETTINGS.weatherByModel)) {
    if (low.includes(key.toLowerCase())) {
      return w
    }
  }
  return 'clear'
}

/**
 * Today's date in the time zone from the settings ('auto': the system's zone,
 * or the region's home zone on a UTC machine); UTC when that zone is unknown.
 */
function localDate(ms: number): DateParts {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: region().timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms))
    const [y, m, d] = parts.split('-').map(Number)
    if (y && m && d) {
      return { y, m, d }
    }
  } catch {
    // Fall back to UTC below.
  }
  const now = new Date(ms)
  return { y: now.getUTCFullYear(), m: now.getUTCMonth() + 1, d: now.getUTCDate() }
}

type Session$ = {
  session: { usage: () => Promise<{ context: { percent?: number } }>; model: () => Promise<string> }
  clock: { now: () => Promise<number> }
}

function snapshot(): string {
  return JSON.stringify([percent, modelId, today])
}

async function refresh($: Session$): Promise<boolean> {
  const before = snapshot()
  try {
    percent = (await $.session.usage()).context.percent ?? percent
  } catch {
    // Keep the last figure.
  }
  try {
    modelId = await $.session.model()
  } catch {
    // Keep the last name.
  }
  try {
    today = localDate(await $.clock.now())
  } catch {
    // Keep the last date.
  }
  return before !== snapshot()
}

function current(): { p: number; date: DateParts; weather: Weather; occasion?: Occasion } {
  return {
    occasion: preview.occasion,
    p: preview.percent ?? percent,
    date: preview.date ?? today,
    weather: preview.weather ?? weatherFor(modelId),
  }
}

/** Preview dates for /winter, by English and German words. */
const PREVIEW_DATES: Record<string, (y: number) => DateParts> = {}
function alias(words: string[], date: (y: number) => DateParts): void {
  for (const w of words) {
    PREVIEW_DATES[w] = date
  }
}
const SEASON_PREVIEW: Record<Season, (y: number) => DateParts> = {
  winter: y => ({ y: y + 1, m: 1, d: 20 }),
  firstSnow: y => ({ y, m: 11, d: 10 }),
  thaw: y => ({ y: y + 1, m: 3, d: 16 }),
  spring: y => ({ y: y + 1, m: 4, d: 25 }),
  summer: y => ({ y: y + 1, m: 7, d: 15 }),
  autumn: y => ({ y: y + 1, m: 10, d: 20 }),
}
const PREVIEW_OCCASIONS: Record<string, Occasion> = {}

/** The next time an occasion comes round, counted from today. */
function next(o: Occasion): (y: number) => DateParts {
  // A year ahead when it has no date soon (e.g. a festival past the end of its table).
  return y => nextOccasionStart(o, today, occasionContext()) ?? { y: y + 1, m: 1, d: 1 }
}

function occasionAlias(words: string[], o: Occasion): void {
  alias(words, next(o))
  for (const w of words) {
    PREVIEW_OCCASIONS[w] = o
  }
}

// Every occasion by its id, then every language's words for seasons and occasions, accents optional.
for (const def of OCCASIONS) {
  occasionAlias([normalizeWord(def.id)], def.id)
}
for (const words of Object.values(WORDS)) {
  for (const [season, list] of Object.entries(words.seasons) as [Season, string[]][]) {
    alias(list.map(normalizeWord), SEASON_PREVIEW[season])
  }
  for (const [o, list] of Object.entries(words.occasions) as [Occasion, string[]][]) {
    occasionAlias([o.toLowerCase(), ...list].map(normalizeWord), o)
  }
}

/** Every language's words for one table of WORDS, normalized, pointing to their meaning. */
function lookup<K extends string>(pick: (w: (typeof WORDS)[Language]) => Record<K, string[]>): Record<string, K> {
  const out: Record<string, K> = {}
  for (const words of Object.values(WORDS)) {
    for (const [meaning, list] of Object.entries(pick(words)) as [K, string[]][]) {
      for (const word of [meaning, ...list]) {
        out[normalizeWord(word)] = meaning
      }
    }
  }
  return out
}
const COMMAND_WORDS = lookup<CommandWord>(w => w.commands)
const WEATHER_WORDS = lookup<Weather>(w => w.weather)
const FALLING_WORDS = lookup<FallingMode>(w => w.falling)
const LANDSCAPE_WORDS = lookup<LandscapeId>(w => w.landscapes)

type Clock$ = { clock: { after: (ms: number, fn: () => void) => unknown }; ui: { invalidate: (event: 'ui.render') => void } }

/** Something happened: in burst mode, let things fall for a few seconds and then clear the sky. */
function stir($: Clock$): void {
  if (fallingMode !== 'burst' && fallingMode !== 'freeze') {
    return
  }
  fallSeq += 1
  const seq = fallSeq
  falling = true
  frozen = false
  $.ui.invalidate('ui.render')
  const freeze = fallingMode === 'freeze'
  const after = freeze ? SETTINGS.falling.burstSeconds : SETTINGS.falling.burstSeconds + 3
  $.clock.after(after * 1000, () => {
    if (fallSeq !== seq) {
      return
    }
    if (freeze) {
      // Draw the same flakes, moved on by the seconds they fell, and hold them there.
      fallShift += SETTINGS.falling.burstSeconds
      frozen = true
    } else {
      falling = false
    }
    $.ui.invalidate('ui.render')
  })
}

function fallFor(): { show: boolean; fadeAfter?: number; shift?: number; paused?: boolean } {
  if (fallingMode === 'off') {
    return { show: false }
  }
  if (fallingMode === 'burst') {
    return falling ? { show: true, fadeAfter: SETTINGS.falling.burstSeconds } : { show: false }
  }
  if (fallingMode === 'freeze') {
    return { show: true, shift: fallShift, paused: frozen }
  }
  return { show: true }
}

function feel($: Clock$, next: Mood): void {
  if (!SETTINGS.moods.enabled) {
    return
  }
  moodSeq += 1
  const seq = moodSeq
  mood = next
  stir($)
  $.ui.invalidate('ui.render')
  $.clock.after(SETTINGS.moods.seconds * 1000, () => {
    if (moodSeq === seq) {
      mood = undefined
      $.ui.invalidate('ui.render')
    }
  })
}

/** "Region: CH (detected via Europe/Zurich) · Europe/Zurich · northern hemisphere" */
function regionText(): string {
  const tx = t()
  const r = region()
  const how =
    r.source.region === 'zone'
      ? tx.regionHow.zone(r.env.timeZone)
      : r.source.region === 'locale'
        ? tx.regionHow.locale(r.env.locale)
        : tx.regionHow[r.source.region]
  return tx.regionLine(r.subdivision || r.region, how, r.timeZone, r.hemisphere)
}

function isPreviewing(): boolean {
  return preview.date !== undefined || preview.weather !== undefined || preview.percent !== undefined || preview.occasion !== undefined
}

function describe(): string {
  const tx = t()
  const c = current()
  const y = yearState(c.date, c.occasion)
  const st = SETTINGS.stages
  const acc = [c.p >= st.hat && tx.accessories.hat, c.p >= st.scarf && tx.accessories.scarf, c.p >= st.broom && (landscape === 'mountains' ? tx.backpack : tx.accessories.broom)].filter(Boolean)
  const mark = (on: boolean): string => (on ? ` ${tx.preview}` : '')
  return [
    `${tx.labels.date}: ${tx.date(c.date.y, c.date.m, c.date.d)}${mark(preview.date !== undefined)}`,
    `${tx.labels.season}: ${tx.seasons[y.season]}${y.occasion ? ` · ${tx.labels.occasion}: ${tx.occasions[y.occasion]}` : ''}`,
    `${tx.labels.model}: ${prettyModel(modelId) || tx.unknownModel} · ${tx.labels.weather}: ${tx.weather[c.weather]}${mark(preview.weather !== undefined)}`,
    `${tx.labels.context}: ${tx.contextShare(Math.round(c.p))}${mark(preview.percent !== undefined)} · ${tx.labels.accessories}: ${acc.length > 0 ? acc.join(', ') : tx.accessories.none}`,
    `${tx.labels.landscape}: ${tx.landscapes[landscape]}`,
    regionText(),
    `${tx.labels.falling}: ${tx.falling[fallingMode]}`,
    `${tx.labels.layout}: ${Math.round((layout?.figureX ?? SETTINGS.layout.figureX) * 100)} % / ${Math.round((layout?.moonX ?? SETTINGS.layout.moonX) * 100)} %`,
  ].concat(isPreviewing() ? [tx.previewHint] : []).join('\n')
}

/** The occasions that apply here, each with its next date, soonest first. */
function occasionList(): string {
  const tx = t()
  const ctx = occasionContext()
  const rows = OCCASIONS.filter(def => isActive(def, ctx))
    .map(def => ({ id: def.id, next: nextOccasionStart(def.id, today, ctx) }))
    .filter((row): row is { id: Occasion; next: DateParts } => row.next !== undefined)
    .sort((a, b) => dayNumber(a.next.y, a.next.m, a.next.d) - dayNumber(b.next.y, b.next.m, b.next.d))
    .map(row => `  ${tx.date(row.next.y, row.next.m, row.next.d)}  ${tx.occasions[row.id]}`)
  const r = region()
  return rows.length > 0 ? [tx.occasionsHeader(r.subdivision || r.region), ...rows].join('\n') : tx.occasionsNone
}

type Command$ = Session$ &
  Clock$ & {
    store: { set: (key: string, value: unknown) => Promise<void>; delete: (key: string) => Promise<void> }
  }

/** What /backdrop (and /winter) answer; the words come from WORDS in any language. */
async function runCommand($: Command$, args: string): Promise<string> {
  const tx = t()
  await refresh($)
  const [first, second] = args.trim().split(/\s+/).filter(Boolean)
  if (first === undefined) {
    return describe()
  }
  const word = normalizeWord(first)
  const value = second === undefined ? undefined : normalizeWord(second)
  const command = COMMAND_WORDS[word]
  const language = currentLanguage()

  switch (command) {
    case 'help':
      return helpFor(language)
    case 'reset':
      delete preview.date
      delete preview.weather
      delete preview.percent
      delete preview.occasion
      stir($)
      $.ui.invalidate('ui.render')
      return `${tx.previewEnded}\n${describe()}`
    case 'date': {
      const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(second ?? '')
      if (m === null) {
        return tx.dateUsage
      }
      preview.date = { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) }
      delete preview.occasion
      break
    }
    case 'weather': {
      const weather = value === undefined ? undefined : WEATHER_WORDS[value]
      if (weather === undefined) {
        return helpFor(language)
      }
      preview.weather = weather
      break
    }
    case 'context':
      if (second === undefined || Number.isNaN(Number(second))) {
        return helpFor(language)
      }
      preview.percent = Math.max(0, Math.min(100, Number(second)))
      break
    case 'cheer':
    case 'fright':
      feel($, command)
      return command === 'cheer' ? tx.cheer : tx.fright
    case 'falling': {
      const mode = value === undefined ? undefined : FALLING_WORDS[value]
      if (mode === undefined) {
        return helpFor(language)
      }
      fallingMode = mode
      await $.store.set('fallingMode', fallingMode).catch(() => undefined)
      falling = true
      stir($)
      $.ui.invalidate('ui.render')
      return tx.fallingSet(tx.falling[fallingMode])
    }
    case 'region': {
      const choice = value ?? ''
      if (choice !== 'auto' && !/^[a-z]{2}(-[a-z0-9]{1,3})?$/.test(choice)) {
        return tx.regionUsage
      }
      chooseRegion(choice === 'auto' ? undefined : choice)
      await (choice === 'auto' ? $.store.delete('region') : $.store.set('region', choice.toUpperCase())).catch(() => undefined)
      await refresh($)
      stir($)
      $.ui.invalidate('ui.render')
      return regionText()
    }
    case 'occasions':
      return occasionList()
    case 'landscape': {
      const choice = value === undefined ? undefined : LANDSCAPE_WORDS[value]
      if (choice === undefined) {
        return tx.landscapeUsage
      }
      landscape = choice
      await $.store.set('landscape', landscape).catch(() => undefined)
      stir($)
      $.ui.invalidate('ui.render')
      return tx.landscapeSet(tx.landscapes[landscape])
    }
    case 'language': {
      const choice = value ?? ''
      if (choice !== 'auto' && !(LANGUAGES as readonly string[]).includes(choice)) {
        return tx.languageUsage
      }
      chooseLanguage(choice === 'auto' ? undefined : choice)
      await (choice === 'auto' ? $.store.delete('language') : $.store.set('language', choice)).catch(() => undefined)
      $.ui.invalidate('ui.render')
      // Answer in the new language.
      const now = currentLanguage()
      return t(now).languageSet(languageName(now, now))
    }
    case 'figure':
    case 'moon':
    case 'layout': {
      if (command === 'layout') {
        if (value === undefined || COMMAND_WORDS[value] !== 'reset') {
          return tx.layoutUsage
        }
        layout = undefined
        await $.store.delete('layout').catch(() => undefined)
        $.ui.invalidate('ui.render')
        return tx.layoutSet(Math.round(SETTINGS.layout.figureX * 100), Math.round(SETTINGS.layout.moonX * 100))
      }
      const share = Number(second)
      if (second === undefined || Number.isNaN(share)) {
        return tx.layoutUsage
      }
      const nextLayout = { figureX: layout?.figureX ?? SETTINGS.layout.figureX, moonX: layout?.moonX ?? SETTINGS.layout.moonX }
      nextLayout[command === 'figure' ? 'figureX' : 'moonX'] = Math.max(0, Math.min(100, share)) / 100
      layout = nextLayout
      await $.store.set('layout', layout).catch(() => undefined)
      $.ui.invalidate('ui.render')
      return tx.layoutSet(Math.round(layout.figureX * 100), Math.round(layout.moonX * 100))
    }
    default: {
      // A season or an occasion to preview.
      const season = PREVIEW_DATES[word]
      if (season === undefined) {
        return `${tx.unknown(args.trim())}\n\n${helpFor(language)}`
      }
      preview.date = season(today.y)
      preview.occasion = PREVIEW_OCCASIONS[word]
    }
  }
  stir($)
  $.ui.invalidate('ui.render')
  return describe()
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.log(unpainted, { to: 'debug' })
    }
    await refresh($)
    const set = await $.theme.set(LOOK)
    // Where no app draws themes (the terminal, or before one attaches), say so in the debug log only.
    if (!set.isDrawn) {
      $.ui.log(`interactive-background: ${set.reason}`, { to: 'debug' })
    }
    try {
      const stored = await $.store.get('fallingMode')
      if (stored === 'always' || stored === 'burst' || stored === 'freeze' || stored === 'off') {
        fallingMode = stored
      }
      const storedLandscape = await $.store.get('landscape')
      if (storedLandscape === 'winter' || storedLandscape === 'mountains') {
        landscape = storedLandscape
      }
      const storedLanguage = await $.store.get('language')
      if (typeof storedLanguage === 'string' && (LANGUAGES as readonly string[]).includes(storedLanguage)) {
        chooseLanguage(storedLanguage)
      }
      const storedRegion = await $.store.get('region')
      if (typeof storedRegion === 'string' && storedRegion !== '') {
        chooseRegion(storedRegion)
      }
      const place = (await $.store.get('layout')) as { figureX?: unknown; moonX?: unknown } | undefined
      if (place && typeof place.figureX === 'number' && typeof place.moonX === 'number') {
        layout = { figureX: place.figureX, moonX: place.moonX }
      }
    } catch {
      // Keep the mode from the settings.
    }
    // The stored region can change the time zone, and so today's date.
    await refresh($)
    for (const name of ['backdrop', 'winter']) {
      try {
        await $.command.register({ name, description: t().commandDescription })
      } catch (error) {
        $.ui.log(`interactive-background: /${name} could not be registered: ${String(error)}`, { to: 'debug' })
      }
    }
    stir($)
    // Look at the date now and then, so seasons and occasions change by themselves.
    $.clock.every(30 * 60 * 1000, () => {
      void refresh($).then(changed => {
        if (changed) {
          $.ui.invalidate('ui.render')
        }
      })
    })

    return next(e)
  })

  for (const command of ['backdrop', 'winter']) {
    on('command.run', { command }, async ($, e) => ({ text: await runCommand($, e.args) })).catch(() => ({ text: 'interactive-background: this command failed.' }))
  }

  // The context fill moved: redraw when anything changed.
  on('session.measure', async ($, e, next) => {
    const result = await next(e)
    const before = snapshot()
    percent = e.context.percent ?? percent
    await refresh($)
    if (before !== snapshot()) {
      stir($)
      $.ui.invalidate('ui.render')
    }
    return result
  })

  // Passing tests make the figure cheer; failing tests and errors give it a fright.
  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    try {
      if (ran.deny !== undefined) {
        return ran
      }
      const command = e.tool === 'Bash' ? String((e as { command?: unknown }).command ?? '') : ''
      if (command !== '' && TEST_COMMAND.test(command)) {
        const output = JSON.stringify(ran.result ?? '').slice(-4000)
        const failed = ran.isError === true || FAILED_SUMMARY.test(output)
        feel($, failed ? 'fright' : 'cheer')
      } else if (ran.isError === true && SETTINGS.moods.onAnyError) {
        feel($, 'fright')
      }
    } catch {
      // A reaction is decoration: never let it disturb the tool call.
    }
    return ran
  }).catch(($, e, next) => next(e))

  // A click on the bare backdrop: a flurry, snow off the trees, a smiling moon.
  on('ui.pointer', ($, e, next) => {
    if (e.scene === SCENE) {
      clickSeq += 1
      const seq = clickSeq
      click = { x: e.x, y: e.y, seq }
      stir($)
      $.ui.invalidate('ui.render')
      $.clock.after(SETTINGS.clickEffectSeconds * 1000, () => {
        if (click?.seq === seq) {
          click = undefined
          $.ui.invalidate('ui.render')
        }
      })
    }
    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.scene !== SCENE) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const c = current()
    const y = yearState(c.date, c.occasion)
    const model = prettyModel(modelId)

    return (
      <Svg
        source={buildScene({ percent: c.p, modelLabel: model, weather: c.weather, date: c.date, occasion: c.occasion, fall: fallFor(), layout, landscape, click, mood })}
        alt={t().alt(t().seasons[y.season], Math.round(c.p), model)}
        isInteractive
      />
    )
  })
}
