# Splash Screen Redesign — Tasks

## Task List

- [x] 1. Redesign Screen 1: Brand/Hero splash with gradient, glass logo backdrop, tagline, feature pills, and entry animation
  - Bump `kSplashSeenKey` to `actirova.splashSeen.v6`
  - Replace the solid-green `_BrandSplash` with a full-screen vertical gradient (`#0F4C35` → `#1DB97B`)
  - Add a radial glow blob positioned in the upper half using a `Positioned` container with a large blurred radial gradient
  - Convert `_BrandSplash` to a `StatefulWidget` with a single `AnimationController` (420ms, `easeOutCubic`) started after a 200ms delay
  - Apply `FadeTransition` + `SlideTransition` (offset 0→0.06 vertical) to the inner column only
  - Add the `assets/logo.png` inside a `ClipOval` + `BackdropFilter(blur:16)` + `Container(110×110, white @14% opacity, border white @20%)` glass circle
  - Add "Actirova" headline (36sp, w900, white) and tagline "Your AI-powered learning companion" (15sp, w500, white @75%)
  - Add a `Row` of three `_GlassPill` widgets: 📚 "Study Smarter" (`Icons.menu_book_rounded`), ⚡ "AI Powered" (`Icons.bolt_rounded`), 🎯 "Stay Focused" (`Icons.track_changes_rounded`) — each pill has glass background (white @12%, blur 8, rounded 99)
  - CTA button "Get Started" with a right-arrow icon suffix, white bg, `#1A6B47` fg, w900, 52h, r14, maxWidth 360
  - No page-dot indicator on Screen 1
  - Requirements: REQ-1 (AC-1.1 through AC-1.7)

- [x] 2. Redesign Screens 2 & 3: Glassmorphism card layout replacing the old image-cover + overlay approach
  - Add `_GlassSplashPage` StatelessWidget that takes `slide`, `page`, `pageCount`, `onNext`
  - Background: full-screen gradient container (Screen 2: `#0D5C3A`→`#25C07F`; Screen 3: `#0A4A2E`→`#1FAD6F`)
  - Texture layer: `Image.asset(slide.imageAsset, fit: BoxFit.cover)` wrapped in `Opacity(opacity: 0.18)` stacked above the gradient
  - Add `_GlassCard` StatelessWidget — `ClipRRect(r:28)` + `BackdropFilter(blur:20)` + `Container(white @16%, border white @22%, shadow)` + `Padding(28)` inner column
  - Inside the card: `_IconCircle` (72×72, gradient bg, white icon @32sp), headline, body, `_PageDots`, "Next"/"Start" button
  - Screen 2 icon gradient: `#4DD9A0`→`#1A9E6B`, icon `Icons.laptop_mac_rounded`
  - Screen 3 icon gradient: `#F5C542`→`#28B57A`, icon `Icons.auto_awesome_rounded`
  - Update `_SplashPage.build` to route to `_GlassSplashPage` for study/community variants (replacing the old `Stack` with image cover + blur overlay)
  - Screen 3 button label is "Start" with `Icons.play_circle_outline_rounded` suffix icon
  - Requirements: REQ-2 (AC-2.1–AC-2.7), REQ-3 (AC-3.1–AC-3.7)

- [x] 3. Polish, verify build, and validate all acceptance criteria
  - Ensure `kSplashSeenKey` is `actirova.splashSeen.v6` (REQ-5, AC-5.4)
  - Confirm no new package imports were added (REQ-5, AC-5.3)
  - Run `flutter analyze` in the `actirova` directory and fix any warnings or errors
  - Run `flutter build apk --debug` (or `flutter build appbundle`) to confirm the project compiles without errors
  - Visually check (via code review) that all three screens match the layout specs in design.md
  - Requirements: REQ-4, REQ-5
