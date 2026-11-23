import { expect, test } from 'claude-code/testing'

import { CH_SNAPSHOT } from './ch-snapshot.js'
import { dayNumber, fromCalendar, fromDayNumber, lastWeekday, occasionOn, orthodoxEaster, type OccasionContext } from './occasions.js'
import { SETTINGS } from './settings.js'

function swiss(subdivision: string): OccasionContext {
  return { region: 'CH', subdivision, hemisphere: 'north', enabled: SETTINGS.occasions, extra: [] }
}

test('Switzerland sees the same occasions as before the table, every day of 2026 and 2027', () => {
  for (const [subdivision, rows] of Object.entries(CH_SNAPSHOT)) {
    const expected = new Map(rows.map(r => r.split(' ') as [string, string]))
    const ctx = swiss(subdivision)
    const differences: string[] = []
    for (let n = dayNumber(2026, 1, 1); n <= dayNumber(2027, 12, 31); n++) {
      const date = fromDayNumber(n)
      const iso = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
      const got = occasionOn(date, ctx) ?? ''
      const want = expected.get(iso) ?? ''
      if (got !== want) {
        differences.push(`${subdivision || 'CH'} ${iso}: ${want || '-'} -> ${got || '-'}`)
      }
    }
    expect(differences).toEqual([])
  }
})

test('date helpers', () => {
  expect(orthodoxEaster(2027)).toEqual({ y: 2027, m: 5, d: 2 })
  expect(orthodoxEaster(2026)).toEqual({ y: 2026, m: 4, d: 12 })
  expect(fromDayNumber(lastWeekday(2026, 5, 0))).toEqual({ y: 2026, m: 5, d: 31 })
  expect(fromDayNumber(lastWeekday(2027, 11, 4))).toEqual({ y: 2027, m: 11, d: 25 })
})

test('calendars from Intl, and no crash without them', () => {
  expect(fromCalendar('hebrew', 2027, 'Kislev', 25).map(fromDayNumber)).toEqual([{ y: 2027, m: 12, d: 25 }])
  expect(fromCalendar('islamic-umalqura', 2027, 10, 1).map(fromDayNumber)).toEqual([{ y: 2027, m: 3, d: 9 }])
  expect(fromCalendar('nonexistent' as 'hebrew', 2027, 1, 1)).toEqual([])
})

test('the United States: Labor Day in September, no Swiss occasions', () => {
  const us: OccasionContext = { region: 'US', subdivision: '', hemisphere: 'north', enabled: SETTINGS.occasions, extra: [] }
  expect(occasionOn({ y: 2027, m: 9, d: 6 }, us)).toBe('labourDay')
  expect(occasionOn({ y: 2027, m: 5, d: 1 }, us)).toBe(undefined)
  expect(occasionOn({ y: 2027, m: 7, d: 4 }, us)).toBe('independenceDayUS')
  expect(occasionOn({ y: 2027, m: 11, d: 25 }, us)).toBe('thanksgiving')
  expect(occasionOn({ y: 2027, m: 8, d: 1 }, us)).toBe(undefined)
  expect(occasionOn({ y: 2027, m: 5, d: 6 }, us)).toBe(undefined)
})
