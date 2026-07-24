import * as React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { processColor } from 'react-native'
import { getHostComponent } from 'react-native-nitro-modules'
import GeneratedCastButtonConfig from '../../../nitrogen/generated/shared/json/CastButtonConfig.json'
import { CastButton } from '../CastButton'
import { CastButton as CastButtonWeb } from '../CastButton.web'

// The real getHostComponent deep-imports RN internals
// (react-native/Libraries/NativeComponent/NativeComponentRegistry), which
// jest cannot provide — stub it with a recording host component.
jest.mock('react-native-nitro-modules', () => ({
  getHostComponent: jest.fn(() => {
    const ReactLocal = require('react')
    return (props: Record<string, unknown>) =>
      ReactLocal.createElement('NativeCastButton', props)
  }),
}))

function render(element: React.ReactElement): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(element)
  })
  return renderer
}

function hostProps(
  renderer: TestRenderer.ReactTestRenderer
): Record<string, unknown> {
  return renderer.root.findByType(
    'NativeCastButton' as unknown as React.ElementType
  ).props
}

describe('CastButton', () => {
  it('renders the generated host component registered as "CastButton"', () => {
    const renderer = render(<CastButton />)
    expect(
      renderer.root.findAllByType(
        'NativeCastButton' as unknown as React.ElementType
      )
    ).toHaveLength(1)

    const mock = getHostComponent as jest.Mock
    expect(mock).toHaveBeenCalledTimes(1)
    const [name, getViewConfig] = mock.mock.calls[0]!
    expect(name).toBe('CastButton')
    // The wrapper's config is an inline mirror (a nitrogen/ import would break
    // bob's lib/ outputs); deep-equality against the generated JSON is the
    // drift guard that keeps it honest across `yarn specs` runs.
    expect(getViewConfig()).toEqual(GeneratedCastButtonConfig)
    act(() => renderer.unmount())
  })

  it('converts a string tintColor via processColor', () => {
    const renderer = render(<CastButton tintColor="red" />)
    expect(hostProps(renderer).tintColor).toBe(processColor('red'))
    expect(typeof hostProps(renderer).tintColor).toBe('number')
    act(() => renderer.unmount())
  })

  it('always passes the tintColor key — null when absent (E11 reset path)', () => {
    const renderer = render(<CastButton />)
    const props = hostProps(renderer)
    expect('tintColor' in props).toBe(true)
    expect(props.tintColor).toBeNull()
    act(() => renderer.unmount())
  })

  it('resets to null when the tintColor prop is removed (E11)', () => {
    const renderer = render(<CastButton tintColor="#ff0000" />)
    expect(typeof hostProps(renderer).tintColor).toBe('number')
    act(() => {
      renderer.update(<CastButton />)
    })
    expect(hostProps(renderer).tintColor).toBeNull()
    act(() => renderer.unmount())
  })

  it('passes style and other ViewProps through', () => {
    const style = { width: 24, height: 24 }
    const renderer = render(
      <CastButton style={style} testID="cast" accessibilityLabel="Cast" />
    )
    const props = hostProps(renderer)
    expect(props.style).toBe(style)
    expect(props.testID).toBe('cast')
    expect(props.accessibilityLabel).toBe('Cast')
    act(() => renderer.unmount())
  })
})

describe('CastButton.web (E3)', () => {
  it('renders null (graceful degradation; native wrapper never imported)', () => {
    const renderer = render(
      <CastButtonWeb tintColor="red" style={{ width: 24 }} />
    )
    expect(renderer.toJSON()).toBeNull()
    act(() => renderer.unmount())
  })
})

describe('generated view config (drift guard)', () => {
  it('validAttributes covers exactly tintColor + hybridRef', () => {
    // A spec/regen drift (new/renamed prop) must fail the suite: the wrapper
    // and both native lanes key off these exact attributes.
    expect(
      Object.keys(GeneratedCastButtonConfig.validAttributes).sort()
    ).toEqual(['hybridRef', 'tintColor'])
    expect(GeneratedCastButtonConfig.uiViewClassName).toBe('CastButton')
  })
})
