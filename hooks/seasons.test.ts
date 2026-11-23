import { expect, test } from 'claude-code/testing'

import { chooseRegion } from './context.js'
import { buildScene, yearState } from './scene.js'

const SYDNEY = { locale: 'en-AU', timeZone: 'Australia/Sydney' }

test('Australia: July is winter, December is summer, Christmas without snow', () => {
  chooseRegion('AU', SYDNEY)
  expect(yearState({ y: 2027, m: 7, d: 20 }).season).toBe('winter')
  const christmas = yearState({ y: 2027, m: 12, d: 25 })
  expect(christmas.season).toBe('summer')
  expect(christmas.snow).toBe(0)
  expect(christmas.occasion).toBe('christmas')
  expect(christmas.figure).toBe('scarecrow')
  // The summer figure wears the Santa hat: the hat's white trim is drawn.
  const svg = buildScene({ percent: 10, modelLabel: 'Opus 5.5', weather: 'clear', date: { y: 2027, m: 12, d: 25 } })
  expect(svg).toContain('<rect x="-50" y="-16" width="100" height="20" rx="10" fill="#ffffff"/>')
  chooseRegion(undefined)
})

test('the northern hemisphere keeps its seasons', () => {
  chooseRegion('CH', { locale: 'de-CH', timeZone: 'Europe/Zurich' })
  expect(yearState({ y: 2027, m: 1, d: 20 }).season).toBe('winter')
  expect(yearState({ y: 2027, m: 7, d: 20 }).season).toBe('summer')
  chooseRegion(undefined)
})
