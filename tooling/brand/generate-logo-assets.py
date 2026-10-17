"""Generate responsive Kapas ki Pukaar assets from the approved logo master.

The approved source is a full bitmap lockup, but its text is soft at small
sizes. Product assets therefore derive the symbol from the master and redraw
English text lockups with local fonts for crisp app and web rendering.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "brand"
SOURCE_LOGO = OUT / "logo-master-v3.png"

CREAM = (247, 243, 232, 255)
DEEP_GREEN = (11, 93, 59, 255)
TEAL = (45, 148, 128, 255)
TRANSPARENT = (0, 0, 0, 0)


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)


def save_webp(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="WEBP", lossless=True, method=6)


def trim_alpha(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha_box = rgba.getchannel("A").getbbox()
    if alpha_box is None:
        raise ValueError(f"Brand source has no visible pixels: {SOURCE_LOGO}")
    return rgba.crop(alpha_box)


def trim_visual_alpha(image: Image.Image, threshold: int = 40) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    cleaned_alpha = alpha.point(lambda value: 0 if value < threshold else value)
    rgba.putalpha(cleaned_alpha)
    box = cleaned_alpha.getbbox()
    if box is None:
        raise ValueError(f"Brand source has no visible pixels above alpha threshold: {SOURCE_LOGO}")
    return rgba.crop(box)


def visible_box(image: Image.Image, threshold: int = 40) -> tuple[int, int, int, int]:
    rgba = image.convert("RGBA")
    mask = rgba.getchannel("A").point(lambda value: 255 if value >= threshold else 0)
    box = mask.getbbox()
    if box is None:
        raise ValueError(f"Brand source has no visible pixels above alpha threshold: {SOURCE_LOGO}")
    return box


def derive_symbol_mark(logo: Image.Image) -> Image.Image:
    left, top, right, bottom = visible_box(logo)
    width = right - left
    height = bottom - top
    symbol_bottom = top + round(height * 0.63)
    pad_x = round(width * 0.045)
    pad_y = round(height * 0.035)
    crop = logo.crop(
        (
            max(0, left - pad_x),
            max(0, top - pad_y),
            min(logo.width, right + pad_x),
            min(logo.height, symbol_bottom + pad_y),
        )
    )
    return trim_visual_alpha(crop)


def sharpen_artwork(image: Image.Image) -> Image.Image:
    rgba = trim_visual_alpha(image)
    high_res = rgba.resize((rgba.width * 2, rgba.height * 2), Image.Resampling.LANCZOS)
    high_res = high_res.filter(ImageFilter.UnsharpMask(radius=1.1, percent=190, threshold=2))
    sharpened = high_res.resize(rgba.size, Image.Resampling.LANCZOS)
    sharpened = sharpened.filter(ImageFilter.UnsharpMask(radius=0.7, percent=140, threshold=1))
    return trim_visual_alpha(sharpened, threshold=18)


def fit(
    artwork: Image.Image,
    canvas_size: tuple[int, int],
    max_size: tuple[int, int],
    background: tuple[int, int, int, int] = TRANSPARENT,
) -> Image.Image:
    canvas = Image.new("RGBA", canvas_size, background)
    fitted = artwork.copy()
    scale = min(max_size[0] / fitted.width, max_size[1] / fitted.height)
    fitted = fitted.resize(
        (max(1, round(fitted.width * scale)), max(1, round(fitted.height * scale))),
        Image.Resampling.LANCZOS,
    )
    x = (canvas_size[0] - fitted.width) // 2
    y = (canvas_size[1] - fitted.height) // 2
    canvas.alpha_composite(fitted, (x, y))
    return canvas


def find_inter_font(weight: str) -> Path:
    matches = sorted(
        ROOT.glob(
            f"node_modules/.pnpm/@expo-google-fonts+inter@*/node_modules/"
            f"@expo-google-fonts/inter/{weight}/Inter_{weight}.ttf"
        )
    )
    if not matches:
        raise FileNotFoundError(
            "Inter font assets are missing. Run pnpm install before generating brand assets."
        )
    return matches[-1]


def tracked_width(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, tracking: int) -> int:
    widths = [draw.textlength(character, font=font) for character in text]
    return round(sum(widths) + tracking * max(0, len(text) - 1))


def draw_tracked(
    draw: ImageDraw.ImageDraw,
    origin: tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int, int],
    tracking: int,
) -> None:
    x, y = origin
    for character in text:
        draw.text((round(x), y), character, font=font, fill=fill)
        x += draw.textlength(character, font=font) + tracking


def make_vertical_lockup(mark: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", (1200, 1280), TRANSPARENT)
    mark_block = fit(mark, (960, 710), (910, 650))
    canvas.alpha_composite(mark_block, (120, 0))

    draw = ImageDraw.Draw(canvas)
    primary = ImageFont.truetype(str(find_inter_font("800ExtraBold")), 205)
    secondary = ImageFont.truetype(str(find_inter_font("600SemiBold")), 86)
    primary_text = "KAPAS"
    secondary_text = "KI PUKAAR"
    primary_width = tracked_width(draw, primary_text, primary, 4)
    secondary_width = tracked_width(draw, secondary_text, secondary, 18)
    draw_tracked(draw, ((1200 - primary_width) // 2, 690), primary_text, primary, DEEP_GREEN, 4)
    draw_tracked(draw, ((1200 - secondary_width) // 2, 932), secondary_text, secondary, TEAL, 18)
    return trim_alpha(canvas)


def make_horizontal_lockup(mark: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", (1760, 620), TRANSPARENT)
    mark_block = fit(mark, (560, 500), (530, 430))
    canvas.alpha_composite(mark_block, (30, 56))

    draw = ImageDraw.Draw(canvas)
    primary = ImageFont.truetype(str(find_inter_font("800ExtraBold")), 190)
    secondary = ImageFont.truetype(str(find_inter_font("600SemiBold")), 74)
    draw_tracked(draw, (620, 105), "KAPAS", primary, DEEP_GREEN, 3)
    draw_tracked(draw, (627, 342), "KI PUKAAR", secondary, TEAL, 15)
    return trim_alpha(canvas)


def make_monochrome_foreground(mark: Image.Image) -> Image.Image:
    red, green, blue, source_alpha = mark.split()
    min_channel = ImageChops.darker(ImageChops.darker(red, green), blue)
    color_strength = ImageOps.invert(min_channel).point(
        lambda value: 0 if value < 80 else min(255, round((value - 80) * 1.7))
    )
    structural_alpha = ImageChops.multiply(color_strength, source_alpha)
    structural_alpha = structural_alpha.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))
    structural_mark = Image.new("RGBA", mark.size, (255, 255, 255, 0))
    structural_mark.putalpha(structural_alpha)
    return fit(structural_mark, (1024, 1024), (548, 548))


def copy_asset(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
    print(f"wrote {destination.relative_to(ROOT)}")


def main() -> None:
    if not SOURCE_LOGO.exists():
        raise FileNotFoundError(f"Approved logo master is missing: {SOURCE_LOGO}")

    source = Image.open(SOURCE_LOGO).convert("RGBA")
    if source.getchannel("A").getextrema()[0] == 255:
        raise ValueError("Approved logo master must have a transparent background")

    logo = trim_visual_alpha(source)
    mark = sharpen_artwork(derive_symbol_mark(source))
    vertical_lockup = make_vertical_lockup(mark)
    horizontal_lockup = make_horizontal_lockup(mark)

    save_png(fit(mark, (1024, 1024), (900, 900)), OUT / "logo-mark.png")
    save_png(mark, OUT / "logo-mark-inline.png")
    for size in (512, 256, 160, 80, 40, 32):
        target = round(size * 0.88)
        save_png(fit(mark, (size, size), (target, target)), OUT / f"logo-mark-{size}.png")
    save_webp(fit(mark, (512, 512), (450, 450)), OUT / "logo-mark.webp")

    save_png(vertical_lockup, OUT / "logo-lockup-vertical.png")
    save_png(vertical_lockup, OUT / "logo-lockup.png")
    save_png(horizontal_lockup, OUT / "logo-lockup-horizontal.png")
    save_webp(horizontal_lockup, OUT / "logo-lockup-horizontal.webp")

    save_png(fit(mark, (1024, 1024), (860, 860), CREAM), OUT / "icon-1024.png")
    save_png(fit(mark, (512, 512), (430, 430), CREAM), OUT / "icon-512.png")
    save_png(fit(mark, (192, 192), (162, 162), CREAM), OUT / "icon-192.png")
    save_png(fit(mark, (180, 180), (152, 152), CREAM), OUT / "apple-icon-180.png")
    save_png(fit(mark, (1024, 1024), (780, 780)), OUT / "adaptive-foreground.png")
    save_png(make_monochrome_foreground(mark), OUT / "monochrome-foreground.png")

    splash = fit(vertical_lockup, (1024, 1024), (720, 820), CREAM)
    save_png(splash, OUT / "splash-lockup.png")
    save_png(splash, OUT / "splash-icon.png")

    for size in (16, 32, 48):
        target = round(size * 0.78)
        save_png(fit(mark, (size, size), (target, target), CREAM), OUT / f"favicon-{size}.png")
    favicon_ico_source = Image.open(OUT / "favicon-48.png").convert("RGBA")
    favicon_ico_source.save(OUT / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])

    save_png(fit(horizontal_lockup, (1200, 630), (940, 520), CREAM), OUT / "social-card-1200x630.png")

    copies: list[tuple[Path, Path]] = [
        (OUT / "logo-mark.png", ROOT / "apps/mobile/assets/logo-mark.png"),
        (OUT / "logo-mark-inline.png", ROOT / "apps/mobile/assets/logo-mark-inline.png"),
        (OUT / "logo-lockup-vertical.png", ROOT / "apps/mobile/assets/logo-lockup.png"),
        (OUT / "icon-1024.png", ROOT / "apps/mobile/assets/icon.png"),
        (OUT / "adaptive-foreground.png", ROOT / "apps/mobile/assets/adaptive-icon.png"),
        (OUT / "monochrome-foreground.png", ROOT / "apps/mobile/assets/monochrome-icon.png"),
        (OUT / "splash-lockup.png", ROOT / "apps/mobile/assets/splash-icon.png"),
        (OUT / "favicon-48.png", ROOT / "apps/mobile/assets/favicon.png"),
        (OUT / "logo-mark-256.png", ROOT / "apps/puwf-portal/public/brand/logo-mark.png"),
        (OUT / "logo-mark.webp", ROOT / "apps/puwf-portal/public/brand/logo-mark.webp"),
        (OUT / "logo-lockup-horizontal.png", ROOT / "apps/puwf-portal/public/brand/logo-lockup.png"),
        (OUT / "logo-lockup-horizontal.webp", ROOT / "apps/puwf-portal/public/brand/logo-lockup.webp"),
        (OUT / "social-card-1200x630.png", ROOT / "apps/puwf-portal/public/brand/social-card.png"),
        (OUT / "icon-512.png", ROOT / "apps/puwf-portal/src/app/icon.png"),
        (OUT / "apple-icon-180.png", ROOT / "apps/puwf-portal/src/app/apple-icon.png"),
        (OUT / "social-card-1200x630.png", ROOT / "apps/puwf-portal/src/app/opengraph-image.png"),
        (OUT / "social-card-1200x630.png", ROOT / "apps/puwf-portal/src/app/twitter-image.png"),
        (OUT / "favicon-32.png", ROOT / "apps/puwf-portal/public/favicon.png"),
        (OUT / "favicon-16.png", ROOT / "apps/puwf-portal/public/favicon-16x16.png"),
        (OUT / "favicon-32.png", ROOT / "apps/puwf-portal/public/favicon-32x32.png"),
        (OUT / "favicon.ico", ROOT / "apps/puwf-portal/public/favicon.ico"),
        (OUT / "icon-192.png", ROOT / "apps/puwf-portal/public/android-chrome-192x192.png"),
        (OUT / "icon-512.png", ROOT / "apps/puwf-portal/public/android-chrome-512x512.png"),
    ]
    for source_path, destination in copies:
        copy_asset(source_path, destination)

    print(f"logo source {source.size}; lockup trimmed {logo.size}; mark derived {mark.size}")
    print(f"vertical lockup {vertical_lockup.size}; horizontal lockup {horizontal_lockup.size}")


if __name__ == "__main__":
    main()
