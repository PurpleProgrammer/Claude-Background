import { expect, test } from 'claude-code/testing'

import { homeZone, localeRegion, resolveRegion, type RegionSettings } from './detect.js'

const AUTO: RegionSettings = { region: 'auto', subdivision: '', timeZone: 'auto', hemisphere: 'auto' }

test('a Swiss machine is detected as Switzerland, northern hemisphere, Europe/Zurich', () => {
  const r = resolveRegion(AUTO, { locale: 'de-CH', timeZone: 'Europe/Zurich' })
  expect(r.region).toBe('CH')
  expect(r.hemisphere).toBe('north')
  expect(r.timeZone).toBe('Europe/Zurich')
  expect(r.source.region).toBe('zone')
})

test('the locale breaks a tie between countries sharing a zone', () => {
  expect(resolveRegion(AUTO, { locale: 'de-LI', timeZone: 'Europe/Zurich' }).region).toBe('LI')
  expect(resolveRegion(AUTO, { locale: 'en-US', timeZone: 'Europe/Zurich' }).region).toBe('CH')
})

test('UTC falls back to the locale, and the days are counted in the region', () => {
  const r = resolveRegion(AUTO, { locale: 'en-US', timeZone: 'UTC' })
  expect(r.region).toBe('US')
  expect(r.source.region).toBe('locale')
  expect(r.timeZone).toBe(homeZone('US') ?? 'UTC')
  expect(resolveRegion(AUTO, { locale: 'en', timeZone: 'Etc/UTC' }).region).toBe('XX')
})

test('the hemisphere comes from the zone latitude', () => {
  expect(resolveRegion(AUTO, { locale: 'en-AU', timeZone: 'Australia/Sydney' }).hemisphere).toBe('south')
  expect(resolveRegion(AUTO, { locale: 'pt-BR', timeZone: 'America/Sao_Paulo' }).hemisphere).toBe('south')
  expect(resolveRegion(AUTO, { locale: 'pt-BR', timeZone: 'America/Manaus' }).hemisphere).toBe('south')
  expect(resolveRegion(AUTO, { locale: 'es-EC', timeZone: 'America/Guayaquil' }).hemisphere).toBe('south')
})

test('values set by hand win, and a subdivision needs its own country', () => {
  const r = resolveRegion({ ...AUTO, region: 'DE', subdivision: 'DE-BY', hemisphere: 'south' }, { locale: 'de-CH', timeZone: 'Europe/Zurich' })
  expect(r.region).toBe('DE')
  expect(r.subdivision).toBe('DE-BY')
  expect(r.hemisphere).toBe('south')
  expect(r.source.region).toBe('setting')
  expect(resolveRegion({ ...AUTO, region: 'DE', subdivision: 'CH-ZH' }, { locale: '', timeZone: 'UTC' }).subdivision).toBe('')
})

test('the old location setting still works', () => {
  const r = resolveRegion({ ...AUTO, location: 'basel' }, { locale: 'en-US', timeZone: 'UTC' })
  expect(r.region).toBe('CH')
  expect(r.subdivision).toBe('CH-BS')
  expect(r.timeZone).toBe('Europe/Zurich')
  expect(r.source.region).toBe('legacy')
})

test('locale regions are read with and without a script part', () => {
  expect(localeRegion('de-CH')).toBe('CH')
  expect(localeRegion('zh-Hant-TW')).toBe('TW')
  expect(localeRegion('fr')).toBe('')
})
