import { useEffect, useRef } from 'react';
import * as Clipboard from 'expo-clipboard';
import { AppState } from 'react-native';

export function useOtpAutoFill(active: boolean, onFill: (code: string) => void) {
  const callbackRef = useRef(onFill);
  callbackRef.current = onFill;

  useEffect(() => {
    if (!active) return;

    const tryFillFromClipboard = async () => {
      const text = await Clipboard.getStringAsync();
      const match = text?.trim().match(/\b(\d{6})\b/);
      if (match) callbackRef.current(match[1]);
    };

    tryFillFromClipboard();

    const stateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tryFillFromClipboard();
    });

    let clipSub: ReturnType<typeof Clipboard.addClipboardListener> | undefined;
    try {
      clipSub = Clipboard.addClipboardListener(() => tryFillFromClipboard());
    } catch {
      // addClipboardListener not available on this platform/OS version
    }

    return () => {
      stateSub.remove();
      clipSub?.remove();
    };
  }, [active]);
}
