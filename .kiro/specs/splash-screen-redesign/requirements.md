# Splash Screen Redesign — Requirements

## Overview

Redesign the three onboarding splash screens in the `actirova` Flutter app (`lib/main.dart`) with a completely new visual system. The new design uses **modern gradient + glassmorphism** aesthetics — rich green-to-teal gradients, glass-effect cards, bold typography, and icon-based accents — while staying true to the Actirova green brand identity.

The splash screens only appear on first launch (controlled by `kSplashSeenKey`). After the final screen, the user proceeds to the main web shell.

---

## Requirements

### REQ-1: Screen 1 — Brand / Hero Screen

**Description:** The first splash screen is the brand identity hero. It must feel premium and immediately communicate the Actirova AI Tutor brand.

**Acceptance Criteria:**
- AC-1.1: Background is a full-screen vertical gradient from `#0F4C35` (deep forest green, top) to `#1DB97B` (vibrant emerald, bottom) with a subtle radial glow blob centered in the upper half.
- AC-1.2: The `assets/logo.png` is displayed as a hero image, centered horizontally, 110×110 logical pixels, with a frosted-glass circular backdrop (white 14% opacity, blur 16px, border white 20% opacity).
- AC-1.3: A bold headline "Actirova" (white, 36sp, `FontWeight.w900`) is displayed below the logo with a 16px gap.
- AC-1.4: A subtitle tagline "Your AI-powered learning companion" (white 75% opacity, 15sp, `FontWeight.w500`) appears below the headline.
- AC-1.5: Three horizontal feature pills (icon + label) are arranged in a row below the tagline: 📚 "Study Smarter", ⚡ "AI Powered", 🎯 "Stay Focused". Each pill has a glass background (white 12% opacity, blur 8px, rounded 99px).
- AC-1.6: A "Get Started" filled button at the bottom center advances to Screen 2. Button style: white background, `#1A6B47` foreground text, `FontWeight.w900`, 15sp, height 52, radius 14, max-width 360. Includes a right arrow icon.
- AC-1.7: There is no page-dot indicator on Screen 1.

---

### REQ-2: Screen 2 — Study Anywhere Screen

**Description:** The second screen communicates accessibility and convenience of learning.

**Acceptance Criteria:**
- AC-2.1: Background is a full-screen gradient from `#0D5C3A` (top) to `#25C07F` (bottom). `pic2.jpg` is overlaid at 18% opacity as a blended texture layer (not the primary visual).
- AC-2.2: A large glassmorphism card floats in the center of the screen: frosted white 16% opacity, blur 20px, rounded corners 28px, thin white 22% opacity border, subtle drop shadow. The card contains the screen's content.
- AC-2.3: Inside the card, a circular icon container (72×72) using `Icons.laptop_mac_rounded` is displayed at the top, with a teal-to-green gradient background (`#4DD9A0` → `#1A9E6B`), white icon at 32sp.
- AC-2.4: Headline text "Make Learning\nAccessible Anywhere" (white, 26sp, `FontWeight.w900`, centered, line height 1.12) is below the icon.
- AC-2.5: Body text "Save yourself time by bringing all your educational tools together." (white 82% opacity, 14sp, `FontWeight.w500`, centered) is below the headline.
- AC-2.6: Page dots indicator (3 dots total, current = 1) is shown below the body text in white tones.
- AC-2.7: A full-width "Next" button matching Screen 1 button style (white bg, green fg) advances to Screen 3. Button label changes to "Start" only on the final screen.

---

### REQ-3: Screen 3 — Empower Your Learning Screen

**Description:** The third and final screen reinforces the AI-powered value prop and leads the user into the app.

**Acceptance Criteria:**
- AC-3.1: Background is a full-screen gradient from `#0A4A2E` (top) to `#1FAD6F` (bottom). `pic1.jpg` is overlaid at 18% opacity as a blended texture layer.
- AC-3.2: Same glassmorphism card layout as Screen 2.
- AC-3.3: Icon is `Icons.auto_awesome_rounded` with a warm gold-to-green gradient (`#F5C542` → `#28B57A`), white, 32sp.
- AC-3.4: Headline "Empower Your\nLearning Experience" (same typography as Screen 2).
- AC-3.5: Body "Get course guidance and study help in a calm mobile workspace." (same style as Screen 2 body).
- AC-3.6: Page dots indicator (3 dots total, current = 2) shown in white tones.
- AC-3.7: Button label is "Start" with a play-circle icon, advances to the main app.

---

### REQ-4: Transitions & Animation

**Acceptance Criteria:**
- AC-4.1: Page swipe transitions use `Curves.easeOutCubic` at 380ms (unchanged from existing).
- AC-4.2: Screen 1 content fades in from slight bottom offset using a simple `AnimatedOpacity` + `AnimatedSlide` combo triggered on `initState` with a 200ms delay and 420ms duration. No animation library needed.
- AC-4.3: The page-dot indicator uses an `AnimatedContainer` for the active dot width expansion (14px active, 5px inactive), 220ms duration (unchanged from existing).

---

### REQ-5: Consistency & Code Quality

**Acceptance Criteria:**
- AC-5.1: All three splash screens are implemented within the existing `_SplashScreens` / `_SplashPage` / `_BrandSplash` class structure in `lib/main.dart`. No new files are required.
- AC-5.2: The `_SplashSlide` data class retains the same fields but the `imageAsset` field on Screen 2 & 3 is now used purely as a texture overlay, not as a full `BoxFit.cover` background.
- AC-5.3: No new package dependencies are added. All visual effects use only built-in Flutter widgets (`BackdropFilter`, `Container` gradients, `ClipRRect`, `BoxDecoration`).
- AC-5.4: The `kSplashSeenKey` version key is bumped to `actirova.splashSeen.v6` so existing users see the new screens once.
- AC-5.5: Code is clean, readable, and follows the existing Dart style in the file.
