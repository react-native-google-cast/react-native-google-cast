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

  /** Peek at the private per-key map (hygiene assertions only). */
  function keyCount(bus: KeyedBus<string, number>): number {
    return (bus as unknown as { handlers: Map<string, unknown> }).handlers.size
  }

  it('prunes the key entry once its last handler unsubscribes', () => {
    const bus = new KeyedBus<string, number>()
    const offA = bus.subscribe('k', jest.fn())
    const offB = bus.subscribe('k', jest.fn())
    expect(keyCount(bus)).toBe(1)
    offA()
    expect(keyCount(bus)).toBe(1) // one handler left — entry stays
    offB()
    expect(keyCount(bus)).toBe(0) // last one out prunes the key
  })

  it('a stale double-unsubscribe cannot drop a successor subscriber on the same key', () => {
    const bus = new KeyedBus<string, number>()
    const off = bus.subscribe('k', jest.fn())
    off() // empties + prunes the original Set
    const successor = jest.fn()
    bus.subscribe('k', successor) // fresh Set under the same key
    off() // stale second call — must not delete the successor's Set
    bus.emit('k', 7)
    expect(successor).toHaveBeenCalledWith(7)
    expect(keyCount(bus)).toBe(1)
  })
})
