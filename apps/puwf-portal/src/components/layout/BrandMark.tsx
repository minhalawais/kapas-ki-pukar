interface Props {
  size?: number;
}

/** Compact mark on a cream plate so its green and white forms remain legible. */
export function BrandMark({ size = 32 }: Props) {
  const plate = size + 8;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-control bg-[color:var(--page-worker)]"
      style={{ width: plate, height: plate }}
    >
      <picture className="block leading-none">
        <source srcSet="/brand/logo-mark.webp" type="image/webp" />
        <img src="/brand/logo-mark.png" alt="" width={size} height={size} className="object-contain" />
      </picture>
    </span>
  );
}
