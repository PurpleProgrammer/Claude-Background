import { expect, test } from 'claude-code/testing'

test('the backdrop draws the winter scene with the commands working', async $ => {
  const out = await $.command.run({ command: 'winter', args: 'ostern' } as Parameters<typeof $.command.run>[0])
  expect(JSON.stringify(out)).toContain('Ostern')
  const ui = await $.ui.mount({
    plugin: 'winterlandschaft',
    surface: 'desktop',
    component: 'Backdrop',
    props: { scene: 'winter', plugin: 'winterlandschaft', glass: false },
  })
  const svg = await ui.find({ type: 'Svg' })
  const src = String((svg as { props?: { source?: string } } | undefined)?.props?.source ?? '')
  expect(src.length).toBeGreaterThan(5000)
  expect(src.length).toBeLessThan(131072)
  await ui.unmount()
})
