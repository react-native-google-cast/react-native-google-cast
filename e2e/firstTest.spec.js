const socket = require('./socket')

describe('Example', () => {
  beforeAll()

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('should show world screen after tap', async () => {
    await element(by.id('Formats')).tap()
    await element(by.id('MP4')).tap()
    await expect(socket).toReceiveMessage(
      expect.objectContaining({ type: 'REQUEST_LOAD' }),
    )
  })
})
