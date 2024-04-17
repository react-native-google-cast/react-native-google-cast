import { addGoogleCastAppDelegateDidFinishLaunchingWithOptions } from '../withIosGoogleCast'
import fs from 'fs'
import path from 'path'

describe(addGoogleCastAppDelegateDidFinishLaunchingWithOptions, () => {
  it(`adds maps import to Expo Modules SDK 48 AppDelegate`, () => {
    const results = addGoogleCastAppDelegateDidFinishLaunchingWithOptions(
      fs.readFileSync(path.join(__dirname, 'AppDelegate.mm'), 'utf8'),
      {
        receiverAppId: 'foobar-bacon',
        suspendSessionsWhenBackgrounded: false,
      }
    )
    // matches a static snapshot
    expect(results.contents).toMatchSnapshot()
    expect(results.contents).toMatch(/foobar-bacon/)
    // did add new content
    expect(results.didMerge).toBe(true)
    // didn't remove old content
    expect(results.didClear).toBe(false)
  })

  it(`fails to add to a malformed app delegate`, () => {
    expect(() =>
      addGoogleCastAppDelegateDidFinishLaunchingWithOptions(`foobar`, {})
    ).toThrow(/foobar/)
  })
})
