// The region, time zone and hemisphere the mod works with: the settings, with
// 'auto' resolved from the system (detect.ts), and a region chosen with
// "/backdrop region" taking the place of the setting.

import { readEnvironment, resolveRegion, type Environment, type Resolved } from './detect.js'
import type { OccasionContext } from './occasions.js'
import { SETTINGS } from './settings.js'

let current: Resolved | undefined
let regionOverride: string | undefined

function compute(env: Environment): Resolved {
  return resolveRegion(
    {
      region: regionOverride ?? SETTINGS.region,
      subdivision: SETTINGS.subdivision,
      timeZone: SETTINGS.timeZone,
      hemisphere: SETTINGS.hemisphere,
      location: (SETTINGS as { location?: string }).location,
    },
    env,
  )
}

/** The resolved region; worked out on first use. */
export function region(): Resolved {
  current ??= compute(readEnvironment())
  return current
}

/** Use a region chosen at run time ('auto' or undefined goes back to the setting), and resolve again. */
export function chooseRegion(choice: string | undefined, env: Environment = readEnvironment()): Resolved {
  regionOverride = choice === undefined || choice.toLowerCase() === 'auto' ? undefined : choice.toUpperCase()
  current = compute(env)
  return current
}

/** What decides which occasions apply, from the resolved region and the settings. */
export function occasionContext(): OccasionContext {
  const r = region()
  return { region: r.region, subdivision: r.subdivision, hemisphere: r.hemisphere, enabled: SETTINGS.occasions, extra: SETTINGS.extraOccasions }
}
