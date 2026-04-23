# Clarifer Mobile

Expo SDK 55 app targeting iOS, Android, and Web simultaneously.

## Local Development Setup

### Supabase Auth Configuration (required for local testing)
1. Go to https://supabase.com → open Clarifer project
2. Go to Authentication → URL Configuration
3. Set Site URL to: http://localhost:8081
4. Add to Redirect URLs: http://localhost:8081
5. Save

This must be done manually by Samira before email confirmation works locally.

## Setup

```bash
cd apps/mobile
npm install --legacy-peer-deps
cp .env.example .env  # then fill in your Supabase credentials
```

## Running

```bash
npm start          # interactive — choose platform from terminal
npm run web        # opens http://localhost:8081 in browser
npm run ios        # iOS Simulator (Mac only)
npm run android    # Android emulator / connected device
```

## Testing on Android

**Option A: Physical device (fastest)**
1. Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) from the Play Store
2. Run: `npx expo start`
3. Scan the QR code with the Expo Go app

**Option B: Android Emulator**
1. Install [Android Studio](https://developer.android.com/studio)
2. Open AVD Manager → create a Virtual Device
3. Start the emulator
4. Run: `npx expo start`
5. Press `a` in the terminal to open on the running emulator

## Testing on iOS (Mac only)

**Option A: iOS Simulator**
1. Install Xcode from the App Store
2. Run: `npx expo start`
3. Press `i` in the terminal to launch the iOS Simulator

**Option B: Physical iPhone**
1. Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) from the App Store
2. Run: `npx expo start`
3. Scan the QR code with the iPhone Camera app

## E2E Tests (Playwright — web only)

Playwright tests run against the live web build at `http://localhost:8081`.

```bash
# Terminal 1 — start the dev server
npx expo start --web

# Terminal 2 — run E2E tests
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui
```

## Unit Tests

Unit tests live in `../../tests/mobile/` and run from the monorepo root:

```bash
# From clarifier/
npx vitest run tests/mobile/
```

## Environment Variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |

## Storage Architecture

| Platform | Session storage |
|---|---|
| iOS / Android | `expo-secure-store` (encrypted keychain) |
| Web | `localStorage` (SSR-guarded: `typeof window !== 'undefined'`) |

Metro automatically resolves `supabase-client.native.ts` for native and `supabase-client.web.ts` for web. No `Platform.OS` checks needed in the client files.
