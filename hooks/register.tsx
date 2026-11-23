import type { Register, ThemeSetArgs } from 'claude-code'

import { t } from './i18n.js'
import { makeColors } from './make-colors.js'
import { buildScene, easterSunday, yearState, type DateParts, type Mood } from './scene.js'
import { SETTINGS, type Weather } from './settings.js'

const SCENE = 'winter'

// Cool, snowy grays by day and a blue winter night.
const { theme, problems } = makeColors({
  label: 'Winter landscape',
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

/** Commands that run tests. */
const TEST_COMMAND =
  /\b(npm|pnpm|yarn|bun)\s+(run\s+)?test\b|\bnpx\s+(jest|vitest|mocha|playwright\s+test)\b|(^|[\s;&|])(jest|vitest|pytest|mocha|rspec|phpunit|tox)\b|\b(cargo|go|dotnet|mix|deno|swift)\s+test\b|\bclaude\s+plugin\s+test\b|\bmake\s+(test|check)\b|\b(gradlew?|mvn)\s+\S*\s*test\b|\bpython3?\s+-m\s+(pytest|unittest)\b/

/** A test runner's summary that reports failures even where the exit code says nothing. */
const FAILED_SUMMARY = /\b[1-9]\d*\s+(failed|failing|failures?|errors?)\b|\bFAIL(ED)?\b/

// Previews set with /winter; they last until /winter reset or a reload.
const preview: { date?: DateParts; weather?: Weather; percent?: number } = {}

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

/** Today's date in Switzerland, where the occasions are counted. */
function swissDate(ms: number): DateParts {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms))
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
    today = swissDate(await $.clock.now())
  } catch {
    // Keep the last date.
  }
  return before !== snapshot()
}

function current(): { p: number; date: DateParts; weather: Weather } {
  return {
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
alias(['winter'], y => ({ y: y + 1, m: 1, d: 20 }))
alias(['firstsnow', 'ersterschnee'], y => ({ y, m: 11, d: 10 }))
alias(['thaw', 'tauwetter', 'schmelze'], y => ({ y: y + 1, m: 3, d: 16 }))
alias(['spring', 'frühling', 'fruehling'], y => ({ y: y + 1, m: 4, d: 25 }))
alias(['summer', 'sommer'], y => ({ y: y + 1, m: 7, d: 15 }))
alias(['autumn', 'fall', 'herbst'], y => ({ y: y + 1, m: 10, d: 20 }))
alias(['womensday', 'tagderfrau', 'frauentag'], y => ({ y: y + 1, m: 3, d: 8 }))
alias(['easter', 'ostern'], y => easterSunday(y + 1))
alias(['labourday', 'laborday', 'mayday', 'tagderarbeit'], y => ({ y: y + 1, m: 5, d: 1 }))
alias(['pentecost', 'whitsun', 'pfingsten'], y => {
  const e = easterSunday(y + 1)
  const p = new Date(Date.UTC(e.y, e.m - 1, e.d + 49))
  return { y: p.getUTCFullYear(), m: p.getUTCMonth() + 1, d: p.getUTCDate() }
})
alias(['halloween'], y => ({ y: y + 1, m: 10, d: 31 }))
alias(['nationalday', 'swissnationalday', 'august1', 'nationalfeiertag'], y => ({ y: y + 1, m: 8, d: 1 }))
alias(['advent'], y => ({ y, m: 12, d: 6 }))
alias(['christmas', 'weihnachten'], y => ({ y, m: 12, d: 24 }))
alias(['newyearseve', 'silvester'], y => ({ y, m: 12, d: 31 }))
alias(['newyear', 'neujahr'], y => ({ y: y + 1, m: 1, d: 1 }))

const WEATHER_WORDS: Record<string, Weather> = {
  clear: 'clear',
  klar: 'clear',
  sunset: 'sunset',
  abendrot: 'sunset',
  fog: 'fog',
  nebel: 'fog',
  magic: 'magic',
  zauber: 'magic',
}
const MOOD_WORDS: Record<string, Mood> = { cheer: 'cheer', jubel: 'cheer', fright: 'fright', schreck: 'fright' }

type Clock$ = { clock: { after: (ms: number, fn: () => void) => unknown }; ui: { invalidate: (event: 'ui.render') => void } }

function feel($: Clock$, next: Mood): void {
  if (!SETTINGS.moods.enabled) {
    return
  }
  moodSeq += 1
  const seq = moodSeq
  mood = next
  $.ui.invalidate('ui.render')
  $.clock.after(SETTINGS.moods.seconds * 1000, () => {
    if (moodSeq === seq) {
      mood = undefined
      $.ui.invalidate('ui.render')
    }
  })
}

function describe(): string {
  const tx = t()
  const c = current()
  const y = yearState(c.date)
  const st = SETTINGS.stages
  const acc = [c.p >= st.hat && tx.accessories.hat, c.p >= st.scarf && tx.accessories.scarf, c.p >= st.broom && tx.accessories.broom].filter(Boolean)
  const mark = (on: boolean): string => (on ? ` ${tx.preview}` : '')
  return [
    `${tx.labels.date}: ${tx.date(c.date.y, c.date.m, c.date.d)}${mark(preview.date !== undefined)}`,
    `${tx.labels.season}: ${tx.seasons[y.season]}${y.occasion ? ` · ${tx.labels.occasion}: ${tx.occasions[y.occasion]}` : ''}`,
    `${tx.labels.model}: ${prettyModel(modelId) || tx.unknownModel} · ${tx.labels.weather}: ${tx.weather[c.weather]}${mark(preview.weather !== undefined)}`,
    `${tx.labels.context}: ${tx.contextShare(Math.round(c.p))}${mark(preview.percent !== undefined)} · ${tx.labels.accessories}: ${acc.length > 0 ? acc.join(', ') : tx.accessories.none}`,
  ].join('\n')
}

function applyArgs(args: string): string {
  const tx = t()
  const [cmd, value] = args.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (cmd === undefined) {
    return describe()
  }
  if (cmd === 'help' || cmd === 'hilfe') {
    return tx.help
  }
  if (cmd === 'reset' || cmd === 'zurück' || cmd === 'zurueck') {
    delete preview.date
    delete preview.weather
    delete preview.percent
    return `${tx.previewEnded}\n${describe()}`
  }
  if ((cmd === 'date' || cmd === 'datum') && value !== undefined) {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value)
    if (m === null) {
      return tx.dateUsage
    }
    preview.date = { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) }
    return describe()
  }
  if ((cmd === 'weather' || cmd === 'wetter') && value !== undefined && WEATHER_WORDS[value] !== undefined) {
    preview.weather = WEATHER_WORDS[value]
    return describe()
  }
  if ((cmd === 'context' || cmd === 'kontext') && value !== undefined && !Number.isNaN(Number(value))) {
    preview.percent = Math.max(0, Math.min(100, Number(value)))
    return describe()
  }
  const season = PREVIEW_DATES[cmd]
  if (season !== undefined) {
    preview.date = season(today.y)
    return describe()
  }
  return `${tx.unknown(args.trim())}\n\n${tx.help}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.log(unpainted)
    }
    await refresh($)
    const set = await $.theme.set(LOOK)
    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }
    await $.command.register({ name: 'winter', description: t().commandDescription })
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

  on('command.run', { command: 'winter' }, async ($, e) => {
    await refresh($)
    const asMood = MOOD_WORDS[e.args.trim().toLowerCase()]
    if (asMood !== undefined) {
      feel($, asMood)
      return { text: asMood === 'cheer' ? t().cheer : t().fright }
    }
    const text = applyArgs(e.args)
    $.ui.invalidate('ui.render')
    return { text }
  })

  // The context fill moved: redraw when anything changed.
  on('session.measure', async ($, e, next) => {
    const result = await next(e)
    const before = snapshot()
    percent = e.context.percent ?? percent
    await refresh($)
    if (before !== snapshot()) {
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
    const y = yearState(c.date)
    const model = prettyModel(modelId)

    return (
      <Svg
        source={buildScene({ percent: c.p, modelLabel: model, weather: c.weather, date: c.date, click, mood })}
        alt={t().alt(t().seasons[y.season], Math.round(c.p), model)}
        isInteractive
      />
    )
  })
}
