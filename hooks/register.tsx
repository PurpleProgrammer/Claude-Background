import type { Register, ThemeSetArgs } from 'claude-code'

import { EINSTELLUNGEN, type Wetter } from './einstellungen.js'
import { makeColors } from './make-colors.js'
import { ANLASS_NAME, buildScene, easterSunday, jahreslauf, type Datum } from './scene.js'

const SCENE = 'winter'

// Cool, snowy grays by day and a blue winter night.
const { theme, problems } = makeColors({
  label: 'Winterlandschaft',
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
let today: Datum = { y: 2026, m: 1, d: 1 }
let click: { x: number; y: number; seq: number } | undefined
let clickSeq = 0

// Previews set with /winter; they last until /winter zurück or a reload.
const preview: { date?: Datum; weather?: Wetter; percent?: number } = {}

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

function weatherFor(id: string): Wetter {
  const low = id.toLowerCase()
  for (const [key, w] of Object.entries(EINSTELLUNGEN.wetterProModell)) {
    if (low.includes(key.toLowerCase())) {
      return w
    }
  }
  return 'klar'
}

/** Today's date in Switzerland. */
function swissDate(ms: number): Datum {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms))
    const [y, m, d] = parts.split('-').map(Number)
    if (y && m && d) {
      return { y, m, d }
    }
  } catch {
    // Fall back to UTC below.
  }
  const t = new Date(ms)
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }
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

function current(): { p: number; date: Datum; weather: Wetter } {
  return {
    p: preview.percent ?? percent,
    date: preview.date ?? today,
    weather: preview.weather ?? weatherFor(modelId),
  }
}

const SEASON_DATES: Record<string, (y: number) => Datum> = {
  winter: y => ({ y: y + 1, m: 1, d: 20 }),
  schmelze: y => ({ y: y + 1, m: 3, d: 16 }),
  tauwetter: y => ({ y: y + 1, m: 3, d: 16 }),
  frühling: y => ({ y: y + 1, m: 4, d: 25 }),
  fruehling: y => ({ y: y + 1, m: 4, d: 25 }),
  sommer: y => ({ y: y + 1, m: 7, d: 15 }),
  herbst: y => ({ y: y + 1, m: 10, d: 20 }),
  ersterschnee: y => ({ y, m: 11, d: 10 }),
  ostern: y => easterSunday(y + 1),
  nationalfeiertag: y => ({ y: y + 1, m: 8, d: 1 }),
  advent: y => ({ y, m: 12, d: 6 }),
  weihnachten: y => ({ y, m: 12, d: 24 }),
  silvester: y => ({ y, m: 12, d: 31 }),
  neujahr: y => ({ y: y + 1, m: 1, d: 1 }),
}

const HELP = [
  'Vorschau der Winterlandschaft:',
  '  /winter                      zeigt den aktuellen Zustand',
  '  /winter <jahreszeit|anlass>  winter, ersterschnee, schmelze, frühling, sommer, herbst,',
  '                               ostern, nationalfeiertag, advent, weihnachten, silvester, neujahr',
  '  /winter datum 2027-03-20     beliebiges Datum',
  '  /winter wetter klar|abendrot|nebel',
  '  /winter kontext 80           Kontext-Füllstand simulieren',
  '  /winter zurück               alle Vorschauen beenden',
].join('\n')

function describe(): string {
  const c = current()
  const y = jahreslauf(c.date)
  const st = EINSTELLUNGEN.stufen
  const acc = [c.p >= st.muetze && 'Mütze', c.p >= st.schal && 'Schal', c.p >= st.besen && 'Besen und Fäustlinge'].filter(Boolean)
  const lines = [
    `Datum: ${c.date.d}.${c.date.m}.${c.date.y}${preview.date ? ' (Vorschau)' : ''}`,
    `Jahreszeit: ${y.season}${y.anlass ? ` · Anlass: ${ANLASS_NAME[y.anlass]}` : ''}`,
    `Modell: ${prettyModel(modelId) || 'unbekannt'} · Wetter: ${c.weather}${preview.weather ? ' (Vorschau)' : ''}`,
    `Kontext: ${Math.round(c.p)} %${preview.percent !== undefined ? ' (Vorschau)' : ''} · Accessoires: ${acc.length > 0 ? acc.join(', ') : 'noch keine'}`,
  ]
  return lines.join('\n')
}

function applyArgs(args: string): string {
  const parts = args.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const [cmd, value] = parts
  if (cmd === undefined) {
    return describe()
  }
  if (cmd === 'hilfe' || cmd === 'help') {
    return HELP
  }
  if (cmd === 'zurück' || cmd === 'zurueck' || cmd === 'reset') {
    delete preview.date
    delete preview.weather
    delete preview.percent
    return 'Vorschau beendet.\n' + describe()
  }
  if (cmd === 'datum' && value !== undefined) {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value)
    if (m === null) {
      return 'Bitte so: /winter datum 2027-03-20'
    }
    preview.date = { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) }
    return describe()
  }
  if (cmd === 'wetter' && (value === 'klar' || value === 'abendrot' || value === 'nebel')) {
    preview.weather = value
    return describe()
  }
  if (cmd === 'kontext' && value !== undefined && !Number.isNaN(Number(value))) {
    preview.percent = Math.max(0, Math.min(100, Number(value)))
    return describe()
  }
  const season = SEASON_DATES[cmd]
  if (season !== undefined) {
    preview.date = season(today.y)
    return describe()
  }
  return `Unbekannt: "${args.trim()}".\n\n${HELP}`
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
    await $.command.register({ name: 'winter', description: 'Winterlandschaft: Vorschau von Jahreszeiten, Anlässen, Wetter und Kontext' })
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

  // A click on the bare backdrop: a flurry, snow off the trees, a smiling moon.
  on('ui.pointer', ($, e, next) => {
    if (e.scene === SCENE) {
      clickSeq += 1
      const seq = clickSeq
      click = { x: e.x, y: e.y, seq }
      $.ui.invalidate('ui.render')
      $.clock.after(EINSTELLUNGEN.klickDauerSekunden * 1000, () => {
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
    const y = jahreslauf(c.date)

    return (
      <Svg
        source={buildScene({ percent: c.p, modelLabel: prettyModel(modelId), weather: c.weather, date: c.date, click })}
        alt={`Landschaft (${y.season}), Kontext zu ${Math.round(c.p)} Prozent gefüllt, Modell ${prettyModel(modelId)}`}
        isInteractive
      />
    )
  })
}
