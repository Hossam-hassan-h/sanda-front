interface LogoProps {
  /** "mark" = icon only, "horizontal" = icon + سندة inline, "full" = icon + سندة + SANDA stacked */
  variant?: "mark" | "horizontal" | "full";
  /** icon height in pixels — width scales automatically from the SVG viewBox to avoid distortion */
  size?: number;
  /** "brand" = teal/gold (default, for light surfaces), "light" = white (for placement on dark/teal brand panels) */
  tone?: "brand" | "light";
  className?: string;
}

function LogoMark({ size, tone }: { size: number; tone: "brand" | "light" }) {
  const stroke = tone === "light" ? "#fff" : "hsl(var(--primary))";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="SANDA"
    >
      <path d="M78 40 A30 30 0 1 1 34 88" stroke={stroke} strokeWidth="7" strokeLinecap="round" />
      <path d="M50 62 L68 46" stroke={stroke} strokeWidth="7" strokeLinecap="round" />
      <path
        d="M68 46 C74 36, 86 30, 96 18 C90 32, 84 44, 70 52 C70 49, 69 47, 68 46 Z"
        stroke={stroke}
        strokeWidth="5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M71 49 L91 24" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ variant = "horizontal", size = 36, tone = "brand", className = "" }: LogoProps) {
  const textColor = tone === "light" ? "#fff" : "hsl(var(--cobalt))";

  if (variant === "mark") {
    return (
      <span className={`inline-flex shrink-0 ${className}`}>
        <LogoMark size={size} tone={tone} />
      </span>
    );
  }

  if (variant === "full") {
    return (
      <span className={`inline-flex flex-col items-center gap-2 ${className}`}>
        <LogoMark size={size} tone={tone} />
        <span className="font-heading font-extrabold text-2xl leading-none" style={{ color: textColor }}>
          سندة
        </span>
        <span className="font-bold text-xs tracking-[0.25em] leading-none" style={{ color: textColor }}>
          SANDA
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} tone={tone} />
      <span className="font-heading font-extrabold text-xl leading-none" style={{ color: textColor }}>
        سندة
      </span>
    </span>
  );
}
