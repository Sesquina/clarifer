// Test-only stub for react-native. The real module contains Flow syntax
// that vitest/rolldown cannot transform. Tests that touch RN components
// should mock the specific exports they need.
export const Platform = { OS: "ios", select: <T,>(obj: { ios?: T; default?: T }) => obj.ios ?? obj.default };
export const AppState = { addEventListener: () => ({ remove: () => {} }), currentState: "active" };
export const StyleSheet = { create: <T,>(s: T) => s };
