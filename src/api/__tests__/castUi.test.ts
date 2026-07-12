import type { FakeCastTransport } from '../../transport/__fakes__/FakeCastTransport'
import { castTransport } from '../../state/castStore.singleton'
import { CastContext } from '../CastContext'

// CastContext pulls the native singleton; swap it for a fake-backed one
// (same pattern as channels.test.ts / useCastChannel.test.tsx).
jest.mock('../../state/castStore.singleton', () => {
  const { CastStore } = require('../../state/CastStore')
  const {
    FakeCastTransport,
  } = require('../../transport/__fakes__/FakeCastTransport')
  const transport = new FakeCastTransport()
  const store = new CastStore(transport)
  return { castStore: store, castTransport: transport }
})

const transport = castTransport as unknown as FakeCastTransport

beforeEach(() => {
  transport.showCastDialogCalls = 0
  transport.showExpandedControlsCalls = 0
  transport.showIntroductoryOverlayCalls.length = 0
  transport.showCastDialogBehavior = async () => true
  transport.showExpandedControlsBehavior = async () => true
  transport.showIntroductoryOverlayBehavior = async () => true
})

describe('CastContext.showCastDialog', () => {
  it('delegates to the transport and resolves `true` when shown', async () => {
    await expect(CastContext.showCastDialog()).resolves.toBe(true)
    expect(transport.showCastDialogCalls).toBe(1)
  })

  it('passes a `false` resolution through (dialog not shown)', async () => {
    transport.showCastDialogBehavior = async () => false
    await expect(CastContext.showCastDialog()).resolves.toBe(false)
  })

  it('surfaces a typed CastError rejection', async () => {
    transport.showCastDialogBehavior = async () => {
      throw { code: 'notSupported', message: 'nope' }
    }
    await expect(CastContext.showCastDialog()).rejects.toMatchObject({
      code: 'notSupported',
    })
  })
})

describe('CastContext.showExpandedControls', () => {
  it('delegates to the transport and resolves `true` when launched', async () => {
    await expect(CastContext.showExpandedControls()).resolves.toBe(true)
    expect(transport.showExpandedControlsCalls).toBe(1)
  })

  it('passes a `false` resolution through (no Activity)', async () => {
    transport.showExpandedControlsBehavior = async () => false
    await expect(CastContext.showExpandedControls()).resolves.toBe(false)
  })

  it('surfaces the E8 misconfiguration rejection', async () => {
    transport.showExpandedControlsBehavior = async () => {
      throw {
        code: 'notSupported',
        message: 'Register NitroExpandedControllerActivity in your manifest.',
      }
    }
    await expect(CastContext.showExpandedControls()).rejects.toMatchObject({
      code: 'notSupported',
    })
  })
})

describe('CastContext.showIntroductoryOverlay', () => {
  it('forwards `once=true` by default (no arguments)', async () => {
    await expect(CastContext.showIntroductoryOverlay()).resolves.toBe(true)
    expect(transport.showIntroductoryOverlayCalls).toEqual([true])
  })

  it('forwards `once=true` for an empty options object', async () => {
    await CastContext.showIntroductoryOverlay({})
    expect(transport.showIntroductoryOverlayCalls).toEqual([true])
  })

  it('forwards an explicit `once: false`', async () => {
    await CastContext.showIntroductoryOverlay({ once: false })
    expect(transport.showIntroductoryOverlayCalls).toEqual([false])
  })

  it('passes a `false` resolution through (no visible button / already shown)', async () => {
    transport.showIntroductoryOverlayBehavior = async () => false
    await expect(CastContext.showIntroductoryOverlay()).resolves.toBe(false)
  })

  it('surfaces a typed CastError rejection', async () => {
    transport.showIntroductoryOverlayBehavior = async () => {
      throw { code: 'unknown', message: 'native failure' }
    }
    await expect(
      CastContext.showIntroductoryOverlay({ once: false })
    ).rejects.toMatchObject({ code: 'unknown' })
  })
})
