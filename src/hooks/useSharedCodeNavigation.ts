import { useEffect } from 'react';
import { consumeSharedCode } from '../utils/shareLink';

export const useSharedCodeNavigation = (
  onSharedCode: (code: string) => void
) => {
  useEffect(() => {
    const loadSharedCode = async () => {
      const sharedCode = await consumeSharedCode();
      if (sharedCode !== null) onSharedCode(sharedCode);
    };

    window.addEventListener('hashchange', loadSharedCode);

    return () => window.removeEventListener('hashchange', loadSharedCode);
  }, [onSharedCode]);
};
