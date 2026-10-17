# Kapas ki Pukaar Brand Assets

The identity uses two responsive forms generated from `logo-mark-v2.png`:

- The text-free mark is used for app icons, favicons, product headers, compact
  navigation, and localized UI.
- The English lockup is used for native launch artwork, web social previews,
  presentations, reports, and other large-format institutional placements.

Urdu and English product names inside the applications remain live text. Do not
place the English lockup beside another app-name heading.

## Generated Outputs

| Asset | Size / format | Intended use |
| --- | --- | --- |
| `logo-mark.png` | 1024 x 1024 PNG, transparent | Master product mark |
| `logo-mark-{512,256,160,80,40,32}.png` | PNG, transparent | Responsive UI marks |
| `logo-mark.webp` | 512 x 512 lossless WebP | Web product chrome |
| `logo-lockup-vertical.png` | Transparent PNG | Portrait and document lockup |
| `logo-lockup-horizontal.png` | Transparent PNG | Wide institutional lockup |
| `logo-lockup-horizontal.webp` | Lossless WebP | Wide web lockup |
| `icon-1024.png` | Opaque PNG | Expo/iOS application icon |
| `adaptive-foreground.png` | 1024 x 1024 PNG, transparent | Android adaptive icon |
| `monochrome-foreground.png` | 1024 x 1024 PNG, transparent | Android themed icon |
| `apple-icon-180.png` | Opaque PNG | Web/iOS Apple touch icon |
| `favicon-{16,32,48}.png` | Opaque PNG | Browser favicons |
| `favicon.ico` | Multi-size ICO | Legacy browser favicon |
| `splash-lockup.png` | 1024 x 1024 PNG | Native launch screen |
| `social-card-1200x630.png` | Opaque PNG | Open Graph and social previews |

Regenerate and distribute every asset with:

```bash
python3 -m pip install --user -r tooling/brand/requirements.txt
pnpm brand:generate
pnpm brand:verify
```

Do not resize or crop the generated files by hand. Platform icons intentionally
include extra safe-zone padding.
