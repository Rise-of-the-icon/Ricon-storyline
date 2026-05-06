let hapticsEnabled = true;
let lastHapticAt = 0;

const HAPTIC_PATTERNS = {
  chapter: 10,
  primary: 8,
  message: [8, 28, 10],
  success: [10, 24, 12],
};

const canVibrate = () => (
  typeof navigator !== "undefined" &&
  typeof navigator.vibrate === "function"
);

const readStoredHapticsPreference = () => {
  try {
    if (typeof window === "undefined") return null;
    const value = window.localStorage.getItem("ricon:haptics");
    if (value === "off") return false;
    if (value === "on") return true;
  } catch {
    // Ignore storage access errors.
  }
  return null;
};

export const configureHaptics = ({ enabled = true } = {}) => {
  const stored = readStoredHapticsPreference();
  hapticsEnabled = stored ?? enabled;
};

export const setHapticsEnabled = (enabled) => {
  hapticsEnabled = Boolean(enabled);
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ricon:haptics", hapticsEnabled ? "on" : "off");
    }
  } catch {
    // Ignore storage access errors.
  }
};

export const triggerHaptic = (kind = "primary") => {
  if (!hapticsEnabled || !canVibrate()) return false;
  const now = Date.now();
  if (now - lastHapticAt < 120) return false; // Avoid haptic spam.
  const pattern = HAPTIC_PATTERNS[kind] || HAPTIC_PATTERNS.primary;
  lastHapticAt = now;
  return navigator.vibrate(pattern);
};
