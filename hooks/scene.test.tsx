import { expect, test } from 'claude-code/testing'

test('the backdrop draws the scene and /winter previews an occasion', async $ => {
  const out = await $.command.run({ command: 'winter', args: 'easter' } as Parameters<typeof $.command.run>[0])
  expect(JSON.stringify(out)).toContain('Easter')
  const ui = await $.ui.mount({
    plugin: 'winter-landscape',
    surface: 'desktop',
    component: 'Backdrop',
    props: { scene: 'winter', plugin: 'winter-landscape', glass: false },
  })
  const svg = await ui.find({ type: 'Svg' })
  const src = String((svg as { props?: { source?: string } } | undefined)?.props?.source ?? '')
  expect(src.length).toBeGreaterThan(5000)
  expect(src.length).toBeLessThan(131072)
  await ui.unmount()
})

test('German words work too', async $ => {
  const out = await $.command.run({ command: 'winter', args: 'ostern' } as Parameters<typeof $.command.run>[0])
  expect(JSON.stringify(out)).toContain('Easter')
})
