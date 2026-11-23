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
  expect(JSON.stringify(await run('falling always'))).toContain('always')
})

test('German words work too', async $ => {
  const out = await $.command.run({ command: 'winter', args: 'ostern' } as Parameters<typeof $.command.run>[0])
  expect(JSON.stringify(out)).toContain('Easter')
})
