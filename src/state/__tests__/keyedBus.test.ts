import { KeyedBus } from '../keyedBus'

describe('KeyedBus', () => {
  it('routes emits to the subscribed key only', () => {
    const bus = new KeyedBus<string, number>()
    const a = jest.fn()
    const b = jest.fn()
    bus.subscribe('a', a)
    bus.subscribe('b', b)
    bus.emit('a', 1)
    expect(a).toHaveBeenCalledWith(1)
    expect(b).not.toHaveBeenCalled()
  })

  it('supports multiple handlers per key', () => {
    const bus = new KeyedBus<string, string>()
    const first = jest.fn()
    const second = jest.fn()
    bus.subscribe('k', first)
    bus.subscribe('k', second)
    bus.emit('k', 'msg')
    expect(first).toHaveBeenCalledWith('msg')
    expect(second).toHaveBeenCalledWith('msg')
  })

  it('unsubscribe removes only that handler', () => {
    const bus = new KeyedBus<string, number>()
    const kept = jest.fn()
    const removed = jest.fn()
    const off = bus.subscribe('k', removed)
    bus.subscribe('k', kept)
    off()
    bus.emit('k', 1)
    expect(removed).not.toHaveBeenCalled()
    expect(kept).toHaveBeenCalledTimes(1)
  })

  it('a handler unsubscribing during emit does not skip the others (copy-on-emit)', () => {
    const bus = new KeyedBus<string, number>()
    const calls: string[] = []
    const off = bus.subscribe('k', () => {
      calls.push('first')
      off()
    })
    bus.subscribe('k', () => calls.push('second'))
    bus.emit('k', 0)
    expect(calls).toEqual(['first', 'second'])
  })

  it('emitting a key with no handlers is a no-op', () => {
    const bus = new KeyedBus<string, number>()
    expect(() => bus.emit('nobody', 1)).not.toThrow()
  })

  it('clear() drops every handler', () => {
    const bus = new KeyedBus<string, number>()
    const handler = jest.fn()
    bus.subscribe('k', handler)
    bus.clear()
    bus.emit('k', 1)
    expect(handler).not.toHaveBeenCalled()
  })
})
