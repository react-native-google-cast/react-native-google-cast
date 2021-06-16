import { useEffect, useState } from 'react';
import CastContext from './CastContext';
export default function useCastState() {
  const [castState, setCastState] = useState();
  useEffect(() => {
    CastContext.getCastState().then(setCastState);
    const changed = CastContext.onCastStateChanged(setCastState);
    return () => {
      changed.remove();
    };
  }, []);
  return castState;
}
//# sourceMappingURL=useCastState.js.map