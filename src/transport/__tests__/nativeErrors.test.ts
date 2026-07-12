import { parseCastError } from '../nativeErrors'

describe('parseCastError (critical-gap #12 translation)', () => {
  it('parses a JSON CastError payload from an Error message', () => {
    const raw = new Error(
      JSON.stringify({ code: 'network', message: 'boom', nativeCode: 7 })
    )
    expect(parseCastError(raw)).toEqual({
      code: 'network',
      message: 'boom',
      nativeCode: 7,
    })
  })

  it('extracts the JSON object when the bridge wraps the message', () => {
    const raw = new Error('Error: {"code":"timeout","nativeCode":15}')
    expect(parseCastError(raw)).toEqual({ code: 'timeout', nativeCode: 15 })
  })

  it('omits message/nativeCode when absent', () => {
    const raw = new Error(JSON.stringify({ code: 'noSession' }))
    expect(parseCastError(raw)).toEqual({ code: 'noSession' })
  })

  it('passes through an already-structured CastError', () => {
    const raw = { code: 'cancelled' as const, nativeCode: 3 }
    expect(parseCastError(raw)).toEqual({ code: 'cancelled', nativeCode: 3 })
  })

  it('parses the P5.2 alreadyRegistered rejection (native register-once guard)', () => {
    const raw = new Error(
      JSON.stringify({
        code: 'alreadyRegistered',
        message: 'A channel for urn:x-cast:x is already registered.',
      })
    )
    expect(parseCastError(raw)).toEqual({
      code: 'alreadyRegistered',
      message: 'A channel for urn:x-cast:x is already registered.',
    })
  })

  it('falls back to "failed" with the raw message for unknown codes', () => {
    const raw = new Error(JSON.stringify({ code: 'banana' }))
    expect(parseCastError(raw)).toEqual({
      code: 'failed',
      message: '{"code":"banana"}',
    })
  })

  it('falls back to "failed" for a non-JSON message', () => {
    expect(parseCastError(new Error('kaboom'))).toEqual({
      code: 'failed',
      message: 'kaboom',
    })
  })

  it('ignores a malformed nativeCode type', () => {
    const raw = new Error(JSON.stringify({ code: 'network', nativeCode: 'x' }))
    expect(parseCastError(raw)).toEqual({ code: 'network' })
  })
})
