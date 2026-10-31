// Telegram Mini App Haptic Feedback helper
export function hapticLight() {
  if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.HapticFeedback) {
    try {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred("light");
    } catch (e) {
      // Safe fallback
    }
  }
}

export function hapticMedium() {
  if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.HapticFeedback) {
    try {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred("medium");
    } catch (e) {
      // Safe fallback
    }
  }
}

export function hapticSuccess() {
  if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.HapticFeedback) {
    try {
      (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    } catch (e) {
      // Safe fallback
    }
  }
}
