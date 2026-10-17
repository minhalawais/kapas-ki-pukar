"""Verify generated brand assets and their distributed application copies."""

from __future__ import annotations

import hashlib
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]

EXPECTED: dict[str, tuple[tuple[int, int], bool]] = {
    "assets/brand/logo-mark.png": ((1024, 1024), True),
    "assets/brand/logo-mark-inline.png": ((632, 497), True),
    "assets/brand/logo-mark-512.png": ((512, 512), True),
    "assets/brand/logo-mark-256.png": ((256, 256), True),
    "assets/brand/logo-mark-160.png": ((160, 160), True),
    "assets/brand/logo-mark-80.png": ((80, 80), True),
    "assets/brand/logo-mark-40.png": ((40, 40), True),
    "assets/brand/logo-mark-32.png": ((32, 32), True),
    "assets/brand/icon-1024.png": ((1024, 1024), False),
    "assets/brand/icon-512.png": ((512, 512), False),
    "assets/brand/icon-192.png": ((192, 192), False),
    "assets/brand/apple-icon-180.png": ((180, 180), False),
    "assets/brand/adaptive-foreground.png": ((1024, 1024), True),
    "assets/brand/monochrome-foreground.png": ((1024, 1024), True),
    "assets/brand/splash-lockup.png": ((1024, 1024), False),
    "assets/brand/favicon-16.png": ((16, 16), False),
    "assets/brand/favicon-32.png": ((32, 32), False),
    "assets/brand/favicon-48.png": ((48, 48), False),
    "assets/brand/social-card-1200x630.png": ((1200, 630), False),
}

COPIES: dict[str, str] = {
    "apps/mobile/assets/logo-mark.png": "assets/brand/logo-mark.png",
    "apps/mobile/assets/logo-mark-inline.png": "assets/brand/logo-mark-inline.png",
    "apps/mobile/assets/icon.png": "assets/brand/icon-1024.png",
    "apps/mobile/assets/adaptive-icon.png": "assets/brand/adaptive-foreground.png",
    "apps/mobile/assets/monochrome-icon.png": "assets/brand/monochrome-foreground.png",
    "apps/mobile/assets/splash-icon.png": "assets/brand/splash-lockup.png",
    "apps/mobile/assets/favicon.png": "assets/brand/favicon-48.png",
    "apps/puwf-portal/public/brand/logo-mark.png": "assets/brand/logo-mark-256.png",
    "apps/puwf-portal/public/brand/logo-mark.webp": "assets/brand/logo-mark.webp",
    "apps/puwf-portal/public/brand/logo-lockup.png": "assets/brand/logo-lockup-horizontal.png",
    "apps/puwf-portal/public/brand/logo-lockup.webp": "assets/brand/logo-lockup-horizontal.webp",
    "apps/puwf-portal/public/brand/social-card.png": "assets/brand/social-card-1200x630.png",
    "apps/puwf-portal/src/app/icon.png": "assets/brand/icon-512.png",
    "apps/puwf-portal/src/app/apple-icon.png": "assets/brand/apple-icon-180.png",
    "apps/puwf-portal/src/app/opengraph-image.png": "assets/brand/social-card-1200x630.png",
    "apps/puwf-portal/src/app/twitter-image.png": "assets/brand/social-card-1200x630.png",
    "apps/puwf-portal/public/favicon.png": "assets/brand/favicon-32.png",
    "apps/puwf-portal/public/favicon-16x16.png": "assets/brand/favicon-16.png",
    "apps/puwf-portal/public/favicon-32x32.png": "assets/brand/favicon-32.png",
    "apps/puwf-portal/public/favicon.ico": "assets/brand/favicon.ico",
    "apps/puwf-portal/public/android-chrome-192x192.png": "assets/brand/icon-192.png",
    "apps/puwf-portal/public/android-chrome-512x512.png": "assets/brand/icon-512.png",
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    errors: list[str] = []

    for relative, (expected_size, needs_transparency) in EXPECTED.items():
        path = ROOT / relative
        if not path.exists():
            errors.append(f"missing {relative}")
            continue
        with Image.open(path) as image:
            if image.size != expected_size:
                errors.append(f"{relative}: expected {expected_size}, got {image.size}")
            rgba = image.convert("RGBA")
            alpha_min, alpha_max = rgba.getchannel("A").getextrema()
            if needs_transparency and alpha_min == 255:
                errors.append(f"{relative}: expected transparent padding")
            if not needs_transparency and (alpha_min, alpha_max) != (255, 255):
                errors.append(f"{relative}: platform image must be fully opaque")

    for copy_relative, source_relative in COPIES.items():
        copy = ROOT / copy_relative
        source = ROOT / source_relative
        if not copy.exists():
            errors.append(f"missing distributed copy {copy_relative}")
        elif not source.exists():
            errors.append(f"missing generated source {source_relative}")
        elif digest(copy) != digest(source):
            errors.append(f"stale distributed copy {copy_relative}")

    favicon_ico = ROOT / "assets/brand/favicon.ico"
    if favicon_ico.exists():
        with Image.open(favicon_ico) as image:
            sizes = set(image.ico.sizes())
        expected_ico_sizes = {(16, 16), (32, 32), (48, 48)}
        if sizes != expected_ico_sizes:
            errors.append(f"assets/brand/favicon.ico: expected {expected_ico_sizes}, got {sizes}")

    if errors:
        raise SystemExit("Brand asset verification failed:\n- " + "\n- ".join(errors))

    print(f"verified {len(EXPECTED)} image specifications and {len(COPIES)} distributed copies")


if __name__ == "__main__":
    main()
