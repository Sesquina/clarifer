interface AnchorLogoProps {
  size?: number;
  className?: string;
  color?: string;
  ariaLabel?: string;
}

export function AnchorLogo({
  size = 48,
  className,
  color,
  ariaLabel = "Clarifer",
}: AnchorLogoProps) {
  const stroke = color || "var(--primary)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={ariaLabel}
      role="img"
    >
      <circle cx="32" cy="16" r="6" fill="none" stroke={stroke} strokeWidth="3" />
      <line x1="32" y1="22" x2="32" y2="52" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <path
        d="M16 36 Q10 44 16 52 Q24 58 32 52 Q40 58 48 52 Q54 44 48 36"
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line x1="20" y1="32" x2="44" y2="32" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
