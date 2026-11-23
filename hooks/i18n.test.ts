import { expect, test } from 'claude-code/testing'

import { resolveRegion } from './detect.js'
import { helpFor, LANGUAGES, normalizeWord, resolveLanguage, t, WORDS } from './i18n.js'

/** Every string in a value, calling functions with sample arguments. */
function strings(value: unknown, path: string, out: [string, string][]): void {
  if (typeof value === 'string') {
    out.push([path, value])
  } else if (typeof value === 'function') {
    out.push([path, String((value as (...a: unknown[]) => unknown)('X', 42, 'Y', 'north'))])
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) strings(v, `${path}.${k}`, out)
  }
}

test('every language has every text, none empty', () => {
  for (const lang of LANGUAGES) {
    const found: [string, string][] = []
    strings(t(lang), lang, found)
    expect(found.length).toBeGreaterThan(100)
    expect(found.filter(([, s]) => s.trim() === '' || s.includes('undefined')).map(([p]) => p)).toEqual([])
  }
})

test("each language's help lists all of its command words", () => {
  for (const lang of LANGUAGES) {
    const help = helpFor(lang)
    for (const [command, words] of Object.entries(WORDS[lang].commands)) {
      expect(`${command}: ${help.includes(words[0] ?? '') ? 'listed' : 'missing'}`).toBe(`${command}: listed`)
    }
  }
})

test('dates and percentages use each language’s own format', () => {
  expect(t('de').date(2027, 3, 8)).toBe('8. März 2027')
  expect(t('fr').contextShare(32)).toBe('32 % de contexte')
  expect(t('en').contextShare(32)).toBe('32% context')
})

test('accents are optional in commands', () => {
  expect(normalizeWord('Pâques')).toBe('paques')
  expect(normalizeWord('Frühling')).toBe('fruhling')
})

test('a Swiss machine with everything on auto: CH, north, Europe/Zurich, German', () => {
  const env = { locale: 'de-CH', timeZone: 'Europe/Zurich' }
  const r = resolveRegion({ region: 'auto', subdivision: '', timeZone: 'auto', hemisphere: 'auto' }, env)
  expect([r.region, r.hemisphere, r.timeZone, r.source.region]).toEqual(['CH', 'north', 'Europe/Zurich', 'zone'])
  expect(resolveLanguage('auto', env.locale)).toBe('de')
  expect(resolveLanguage('auto', 'pt-BR')).toBe('en')
  expect(resolveLanguage('it', 'de-CH')).toBe('it')
})
