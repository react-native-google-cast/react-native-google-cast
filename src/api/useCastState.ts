import { useEffect, useState } from 'react'
import CastState from '../types/CastState'
import CastContext from './CastContext'

export default function useCastState() {
  const [castState, setCastState] = useState<CastState>()

  useEffect(() => {
    CastContext.getCastState().then(setCastState)

    const changed = CastContext.onCastStateChanged(setCastState)

    return () => {
      changed.remove()
    }
  }, [])

  return castState
}
