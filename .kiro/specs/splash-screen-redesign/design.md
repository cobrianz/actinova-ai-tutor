# Splash Screen Redesign — Design

## Visual Language

### Color Palette
| Token | Hex | Usage |
|---|---|---|
| `deepForest` | `#0F4C35` | Gradient top (Screen 1) |
| `darkForest` | `#0D5C3A` | Gradient top (Screen 2) |
| `deeperForest` | `#0A4A2E` | Gradient top (Screen 3) |
| `vibrantEmerald` | `#1DB97B` | Gradient bottom (Screen 1) |
| `brightGreen` | `#25C07F` | Gradient bottom (Screen 2) |
| `midGreen` | `#1FAD6F` | Gradient bottom (Screen 3) |
| `glassWhite` | `white @ 14%–16% opacity` | Card/pill backgrounds |
| `glassBorder` | `white @ 20%–22% opacity` | Card borders |

### Typography
- Headlines: `FontWeight.w900`, `Colors.white`, 26–36sp, line height 1.08–1.12
- Body: `FontWeight.w500`, `Colors.white @ 82–88%`, 14sp, line height 1.42
- Button label: `FontWeight.w900`, 15sp

### Glassmorphism Pattern
Applied to both the card on Screens 2 & 3 and the logo backdrop on Screen 1:
```
ClipRRect(
  borderRadius: BorderRadius.circular(radius),
  child: BackdropFilter(
    filter: ImageFilter.blur(sigmaX: blurX, sigmaY: blurY),
    child: Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: opacity),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: Colors.white.withValues(alpha: borderOpacity)),
        boxShadow: [BoxShadow(...)],
      ),
      child: content,
    ),
  ),
)
```

---

## Architecture

### File Changes
Only `actirova/lib/main.dart` is modified. No new files, no new packages.

### Class Breakdown

#### `_SplashScreens` (StatefulWidget — unchanged structure)
- Holds `PageController`, current `_page` index.
- Drives `PageView.builder` over `_slides` (3 items).
- `_next()` advances page or calls `widget.onComplete()`.

#### `_SplashSlide` (data class — unchanged fields)
- `variant` enum distinguishes `brand` | `study` | `community`.
- `imageAsset` on study/community slides is now used as a low-opacity texture, not a full cover background.

#### `_SplashPage` (StatelessWidget — routing only)
- Routes to `_BrandSplash` when `variant == brand`.
- Routes to `_GlassSplashPage` for study/community variants.

#### `_BrandSplash` → renamed/redesigned as `_BrandSplash` (StatefulWidget for entry animation)
- Manages a single `AnimationController` for the fade+slide-up entrance.
- Layout: `Stack` → gradient background + glow blob → centered `Column` (logo glass circle, headline, tagline, feature pills, spacer, CTA button).

#### `_GlassSplashPage` (new, replaces the old `_SplashPage` content block)
- `Stack`: gradient background + texture image (18% opacity, `BoxFit.cover`) + centered `_GlassCard` + bottom safe-area padding.
- `_GlassCard`: the frosted card container with icon, headline, body, dots, and button.

#### `_GlassCard` (StatelessWidget)
- Parameters: `slide`, `page`, `pageCount`, `onNext`.
- Uses `ClipRRect` + `BackdropFilter` + `Container` for the glass effect.

#### `_PageDots` (unchanged)

---

## Layout Specs

### Screen 1 — Brand Splash

```
SafeArea
└── Stack (full screen)
    ├── Container (gradient: #0F4C35 → #1DB97B, vertical)
    ├── Positioned radial glow blob (top: -60, center, 320×320, #4FC58A @ 28%, blur 80)
    └── Padding(24) → Column
        ├── Spacer
        ├── ClipOval → BackdropFilter(blur 16) → Container(110×110, white 14%) 
        │     └── Image.asset('assets/logo.png', 80×80)
        ├── SizedBox(16)
        ├── Text('Actirova', 36sp, w900, white)
        ├── SizedBox(6)
        ├── Text(tagline, 15sp, w500, white 75%)
        ├── SizedBox(32)
        ├── Row(feature pills, mainAxis: center, spacing: 10)
        │     ├── _GlassPill(icon: book, 'Study Smarter')
        │     ├── _GlassPill(icon: bolt, 'AI Powered')
        │     └── _GlassPill(icon: target, 'Stay Focused')
        ├── Spacer
        └── ConstrainedBox(maxWidth:360) → FilledButton('Get Started →')
```

### Screens 2 & 3 — Glass Splash

```
Stack (full screen, no SafeArea on outer)
├── Container (gradient background, full screen)
├── Image.asset(imageAsset, fit: cover, opacity: 0.18)  ← texture layer
└── SafeArea
    └── Center
        └── Padding(horizontal: 24)
            └── _GlassCard
                └── ClipRRect(r=28) → BackdropFilter(blur 20)
                    └── Container(white 16%, border white 22%, shadow)
                        └── Padding(28) → Column
                            ├── _IconCircle(72×72, gradient, icon 32sp)
                            ├── SizedBox(20)
                            ├── Text(title, 26sp, w900)
                            ├── SizedBox(12)
                            ├── Text(body, 14sp, w500)
                            ├── SizedBox(20)
                            ├── _PageDots(current, count=3)
                            ├── SizedBox(24)
                            └── FilledButton(label, white bg)
```

---

## Animation Details

### Screen 1 Entry Animation
- `AnimationController` with `duration: 420ms`.
- `CurvedAnimation(curve: Curves.easeOutCubic)`.
- `Tween<Offset>(begin: Offset(0, 0.06), end: Offset.zero)` → `SlideTransition`.
- `Tween<double>(begin: 0.0, end: 1.0)` → `FadeTransition`.
- Started after a 200ms `Future.delayed` in `initState`.
- Applied to the inner `Column` only (background does not animate).

---

## Key Constants

```dart
const _kSplashGradient1 = LinearGradient(
  begin: Alignment.topCenter, end: Alignment.bottomCenter,
  colors: [Color(0xFF0F4C35), Color(0xFF1DB97B)],
);
const _kSplashGradient2 = LinearGradient(...Color(0xFF0D5C3A), Color(0xFF25C07F)...);
const _kSplashGradient3 = LinearGradient(...Color(0xFF0A4A2E), Color(0xFF1FAD6F)...);
const _kIconGradient2 = LinearGradient(colors: [Color(0xFF4DD9A0), Color(0xFF1A9E6B)]);
const _kIconGradient3 = LinearGradient(colors: [Color(0xFFF5C542), Color(0xFF28B57A)]);
```
