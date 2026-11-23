import { expect, test } from 'claude-code/testing'

test('the backdrop draws the scene and /winter previews an occasion', async $ => {
  const out = await $.command.run({ command: 'winter', args: 'easter' } as Parameters<typeof $.command.run>[0])
  expect(JSON.stringify(out)).toContain('Easter')
  const ui = await $.ui.mount({
    plugin: 'interactive-background',
    surface: 'desktop',
    component: 'Backdrop',
    props: { scene: 'winter', plugin: 'interactive-background', glass: false },
  })
  const svg = await ui.find({ type: 'Svg' })
  const src = String((svg as { props?: { source?: string } } | undefined)?.props?.source ?? '')
  expect(src.length).toBeGreaterThan(5000)
  expect(src.length).toBeLessThan(131072)
  await ui.unmount()
})

test('new occasions and Fable weather can be previewed', async $ => {
  const run = (args: string) => $.command.run({ command: 'winter', args } as Parameters<typeof $.command.run>[0])
  await run('region ch')
  expect(JSON.stringify(await run('halloween'))).toContain('Halloween')
  expect(JSON.stringify(await run('pentecost'))).toContain('Pentecost')
  expect(JSON.stringify(await run('labourday'))).toContain('Labour Day')
  expect(JSON.stringify(await run('womensday'))).toContain("Women's Day")
  expect(JSON.stringify(await run('weather magic'))).toContain('magic')
})

test('more occasions, local customs and /backdrop', async $ => {
  const run = (command: string, args: string) => $.command.run({ command, args } as Parameters<typeof $.command.run>[0])
  expect(JSON.stringify(await run('backdrop', 'fasnacht'))).toContain('Carnival')
  expect(JSON.stringify(await run('backdrop', 'sechseläuten'))).toContain('Sechseläuten')
  expect(JSON.stringify(await run('backdrop', 'auffahrt'))).toContain('Ascension Day')
  expect(JSON.stringify(await run('winter', 'muttertag'))).toContain("Mother's Day")
  expect(JSON.stringify(await run('winter', 'nikolaus'))).toContain('St Nicholas Day')
  expect(JSON.stringify(await run('winter', 'summer'))).toContain('Summer')
})

test('falling can be switched', async $ => {
  const run = (args: string) => $.command.run({ command: 'backdrop', args } as Parameters<typeof $.command.run>[0])
  expect(JSON.stringify(await run('falling burst'))).toContain('a few seconds')
  expect(JSON.stringify(await run('fallen aus'))).toContain('off')
  expect(JSON.stringify(await run('fallen einfrieren'))).toContain('frozen in mid-air')
  expect(JSON.stringify(await run('falling always'))).toContain('always')
})

test('figure and moon can be moved', async $ => {
  const run = (args: string) => $.command.run({ command: 'backdrop', args } as Parameters<typeof $.command.run>[0])
  expect(JSON.stringify(await run('figure 20'))).toContain('Figure at 20 %')
  expect(JSON.stringify(await run('mond 85'))).toContain('moon at 85 %')
  expect(JSON.stringify(await run('layout reset'))).toContain('Figure at 27 %')
})

test('a region can be chosen, and lists its occasions', async $ => {
  const run = (args: string) => $.command.run({ command: 'backdrop', args } as Parameters<typeof $.command.run>[0])
  expect(JSON.stringify(await run('region us'))).toContain('Region: US (set)')
  const list = JSON.stringify(await run('occasions'))
  for (const name of ['Independence Day', 'Thanksgiving', 'Labor Day', 'Halloween', 'Christmas']) {
    expect(list).toContain(name)
  }
  for (const name of ['Sechseläuten', 'Ascension Day', 'Swiss National Day', 'Pentecost']) {
    expect(list).not.toContain(name)
  }
  expect(JSON.stringify(await run('region xyz'))).toContain('Usage')
  expect(JSON.stringify(await run('region auto'))).toContain('Region:')
})

test('a preview says how to end it, and the language can be switched', async $ => {
  const run = (args: string) => $.command.run({ command: 'backdrop', args } as Parameters<typeof $.command.run>[0])
  expect(JSON.stringify(await run('summer'))).toContain('/backdrop reset goes back to today')
  expect(JSON.stringify(await run('reset'))).not.toContain('Preview active')
  expect(JSON.stringify(await run('sprache de'))).toContain('Sprache: Deutsch')
  expect(JSON.stringify(await run('summer'))).toContain('/backdrop zurück kehrt zu heute zurück')
  expect(JSON.stringify(await run('langue fr'))).toContain('Langue\u00a0: français')
  expect(JSON.stringify(await run('language xx'))).toContain('/backdrop langue en|de|fr|it|es|auto')
  expect(JSON.stringify(await run('language auto'))).toContain('Language: English')
})

test('the mountains: an ibex instead of the snowman, switched by command', async $ => {
  const run = (args: string) => $.command.run({ command: 'backdrop', args } as Parameters<typeof $.command.run>[0])
  expect(JSON.stringify(await run('landscape mountains'))).toContain('Landscape: mountains')
  const state = JSON.stringify(await run('context 90'))
  expect(state).toContain('Landscape: mountains')
  expect(state).toContain('backpack and rope')
  expect(JSON.stringify(await run('landschaft winterlandschaft'))).toContain('winter landscape')
  expect(JSON.stringify(await run('landscape moon'))).toContain('/backdrop landscape winter|mountains')
})

test('German words work too', async $ => {
  const out = await $.command.run({ command: 'winter', args: 'ostern' } as Parameters<typeof $.command.run>[0])
  expect(JSON.stringify(out)).toContain('Easter')
})
