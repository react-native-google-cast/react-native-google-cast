import * as React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { processColor, View, type ColorValue } from 'react-native'
import { getHostComponent } from 'react-native-nitro-modules'
import GeneratedCastButtonConfig from '../../../nitrogen/generated/shared/json/CastButtonConfig.json'
import { CastButton } from '../CastButton'
import { CastButton as CastButtonWeb } from '../CastButton.web'
import {
  clearWebSdkGlobals,
  installFakeWebSdk,
} from '../../transport/__fakes__/fakeWebCastSdk'

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

describe('CastButton.web (v5-86p)', () => {
  afterEach(() => {
    clearWebSdkGlobals()
  })

  function launcher(
    renderer: TestRenderer.ReactTestRenderer
  ): TestRenderer.ReactTestInstance {
    return renderer.root.findByType(
      'google-cast-launcher' as unknown as React.ElementType
    )
  }

  it('renders null when the SDK is absent (graceful; native wrapper never imported)', () => {
    const renderer = render(
      <CastButtonWeb tintColor="red" style={{ width: 24 }} />
    )
    expect(renderer.toJSON()).toBeNull()
    act(() => renderer.unmount())
  })

  it('renders the <google-cast-launcher> element when the SDK is present', () => {
    installFakeWebSdk()
    const renderer = render(<CastButtonWeb />)
    const element = launcher(renderer)
    // Framework owns appearance/clicks; the launcher just fills the wrapper.
    expect(element.props.style).toMatchObject({
      display: 'block',
      width: '100%',
      height: '100%',
    })
    // No tintColor → no color custom properties (SDK defaults apply).
    expect(element.props.style['--connected-color']).toBeUndefined()
    expect(element.props.style['--disconnected-color']).toBeUndefined()
    act(() => renderer.unmount())
  })

  it('maps tintColor to both --connected-color and --disconnected-color', () => {
    installFakeWebSdk()
    const renderer = render(<CastButtonWeb tintColor="#ff0000" />)
    const style = launcher(renderer).props.style
    expect(style['--connected-color']).toBe('#ff0000')
    expect(style['--disconnected-color']).toBe('#ff0000')
    act(() => renderer.unmount())
  })

  it('converts non-string ColorValues via processColor to rgba()', () => {
    installFakeWebSdk()
    // A numeric ColorValue exercises the processColor branch: 0xff0000ff is
    // RRGGBBAA (opaque red) which processColor rotates to 0xffff0000.
    expect(processColor(0xff0000ff)).toBe(0xffff0000)
    const renderer = render(
      <CastButtonWeb tintColor={0xff0000ff as unknown as ColorValue} />
    )
    const style = launcher(renderer).props.style
    expect(style['--connected-color']).toBe('rgba(255, 0, 0, 1)')
    expect(style['--disconnected-color']).toBe('rgba(255, 0, 0, 1)')
    act(() => renderer.unmount())
  })

  it('passes style and other ViewProps to the wrapper View', () => {
    installFakeWebSdk()
    const style = { width: 24, height: 24 }
    const renderer = render(
      <CastButtonWeb style={style} testID="cast" accessibilityLabel="Cast" />
    )
    const view = renderer.root.findByType(View)
    expect(view.props.style).toBe(style)
    expect(view.props.testID).toBe('cast')
    expect(view.props.accessibilityLabel).toBe('Cast')
    // tintColor is consumed by the wrapper, not leaked onto the View.
    expect('tintColor' in view.props).toBe(false)
    act(() => renderer.unmount())
  })

  it('appears once the SDK announces readiness via __onGCastApiAvailable', () => {
    const renderer = render(<CastButtonWeb />)
    expect(renderer.toJSON()).toBeNull()

    installFakeWebSdk()
    act(() => {
      ;(
        globalThis as {
          __onGCastApiAvailable?: (available: boolean) => void
        }
      ).__onGCastApiAvailable?.(true)
    })
    expect(launcher(renderer)).toBeDefined()
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
