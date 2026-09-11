// import { GraduationCap } from "lucide-react";

// export default function AuthLayout({ title, subtitle, children }) {
//   return (
//     <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-ink-900 px-4 py-10">
//       {/* Background flourish - gradient mesh + dotted texture standing in for a photograph */}
//       <div className="absolute inset-0" aria-hidden="true">
//         <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-800 to-ink-600" />
//         <div className="absolute inset-0 pattern-dots opacity-40" />
//         <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl" />
//         <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-ink-400/30 blur-3xl" />
//       </div>

//       {/* Logo, pinned top-left */}
//       <div className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-2 z-10">
//         <div className="h-9 w-9 rounded-lg bg-amber-400 flex items-center justify-center">
//           <GraduationCap size={20} className="text-ink-900" />
//         </div>
//         <span className="font-display text-xl text-white tracking-tight">
//           EduBatch
//         </span>
//       </div>

//       {/* Centered form card */}
//       <div className="relative z-10 w-full max-w-md mt-16 sm:mt-0">
//         <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-7 sm:p-10">
//           <h2 className="font-display text-2xl text-ink-800 mb-1">{title}</h2>
//           {subtitle ? (
//             <p className="text-sm text-ink-400 mb-6">{subtitle}</p>
//           ) : (
//             <div className="mb-6" />
//           )}
//           {children}
//         </div>
//         <p className="text-center text-xs text-white/40 mt-6">
//           Built for coaching institutes, tuition centers and small schools.
//         </p>
//       </div>
//     </div>
//   );
// }

import { GraduationCap } from "lucide-react";

/**
 * Original, hand-built SVG illustration — a small campus at dusk with
 * floating education icons (cap, book, pencil, chart-growth) — used as the
 * auth-pages backdrop instead of a flat navy gradient. No external photos
 * are used (keeps the bundle light and avoids licensing a stock photo), but
 * it reads as a proper "hero" background like the reference design.
 */
function AuthBackground() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12153a" />
          <stop offset="45%" stopColor="#1b2559" />
          <stop offset="80%" stopColor="#2a3159" />
          <stop offset="100%" stopColor="#3d4571" />
        </linearGradient>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#eec37e" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#e0a458" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#e0a458" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="buildingFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1f2547" />
          <stop offset="100%" stopColor="#171b3d" />
        </linearGradient>
        <radialGradient id="vignette" cx="50%" cy="58%" r="65%">
          <stop offset="0%" stopColor="#12153a" stopOpacity="0.35" />
          <stop offset="60%" stopColor="#12153a" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#12153a" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      {/* sky */}
      <rect width="1600" height="1000" fill="url(#sky)" />

      {/* soft "sunset" glow behind the campus */}
      <circle cx="1180" cy="430" r="380" fill="url(#sun)" />

      {/* grid / dotted texture for depth, matches the app's pattern-dots */}
      <g opacity="0.12">
        {Array.from({ length: 22 }).map((_, row) =>
          Array.from({ length: 34 }).map((_, col) => (
            <circle
              key={`${row}-${col}`}
              cx={20 + col * 48}
              cy={20 + row * 48}
              r="1.4"
              fill="#ffffff"
            />
          )),
        )}
      </g>

      {/* floating education icons - book */}
      <g
        transform="translate(180,190) rotate(-8)"
        stroke="#eec37e"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.55"
      >
        <path d="M0 10 Q35 -8 70 10 L70 70 Q35 52 0 70 Z" />
        <path d="M70 10 Q105 -8 140 10 L140 70 Q105 52 70 70 Z" />
      </g>

      {/* graduation cap */}
      <g
        transform="translate(1290,150) scale(1.05)"
        stroke="#eec37e"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.5"
      >
        <path d="M0 20 L55 0 L110 20 L55 40 Z" />
        <path d="M28 30 L28 55 Q55 70 82 55 L82 30" />
        <line x1="98" y1="24" x2="98" y2="60" />
        <circle cx="98" cy="63" r="4" fill="#eec37e" stroke="none" />
      </g>

      {/* pencil */}
      <g
        transform="translate(230,430) rotate(35)"
        stroke="#faebce"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.4"
      >
        <rect x="0" y="0" width="18" height="90" rx="2" />
        <path d="M0 90 L9 112 L18 90 Z" />
        <line x1="0" y1="18" x2="18" y2="18" />
      </g>

      {/* small growth-chart motif (batches / progress) */}
      <g
        transform="translate(1360,470)"
        stroke="#eec37e"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      >
        <polyline points="0,60 30,30 60,45 95,0" />
        <circle cx="95" cy="0" r="5" fill="#eec37e" stroke="none" />
      </g>

      {/* small stars scattered around */}
      {[
        [110, 620],
        [1460, 260],
        [520, 120],
        [980, 90],
        [1500, 620],
      ].map(([x, y], i) => (
        <path
          key={i}
          d={`M${x} ${y - 8} l2.4 7.4 h7.8 l-6.3 4.6 2.4 7.4 -6.3 -4.6 -6.3 4.6 2.4 -7.4 -6.3 -4.6 h7.8 Z`}
          fill="#eec37e"
          opacity={0.35}
        />
      ))}

      {/* campus skyline silhouette anchored to the bottom */}
      <g>
        {/* main hall */}
        <rect
          x="520"
          y="620"
          width="420"
          height="380"
          fill="url(#buildingFace)"
        />
        {/* pediment / roof triangle */}
        <path d="M500 620 L730 500 L960 620 Z" fill="#232a52" />
        {/* clock tower */}
        <rect x="700" y="380" width="60" height="240" fill="#232a52" />
        <circle
          cx="730"
          cy="410"
          r="22"
          fill="#171b3d"
          stroke="#eec37e"
          strokeWidth="3"
        />
        <line
          x1="730"
          y1="410"
          x2="730"
          y2="396"
          stroke="#eec37e"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="730"
          y1="410"
          x2="740"
          y2="410"
          stroke="#eec37e"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d="M690 380 L730 350 L770 380 Z" fill="#171b3d" />
        {/* pillars */}
        {[560, 620, 680, 800, 860, 900].map((x) => (
          <rect
            key={x}
            x={x}
            y="660"
            width="18"
            height="340"
            fill="#2a3159"
            opacity="0.6"
          />
        ))}
        {/* entrance */}
        <path
          d="M690 1000 L690 820 Q730 780 770 820 L770 1000 Z"
          fill="#12153a"
        />
        {/* windows, lit warm amber like the reference screenshot */}
        {[560, 610, 850, 900].map((x) =>
          [700, 780, 860].map((y) => (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="24"
              height="34"
              rx="3"
              fill="#eec37e"
              opacity="0.55"
            />
          )),
        )}

        {/* left wing */}
        <rect
          x="260"
          y="740"
          width="260"
          height="260"
          fill="url(#buildingFace)"
        />
        <path d="M250 740 L390 660 L530 740 Z" fill="#232a52" />
        {[300, 350, 400, 450].map((x) => (
          <rect
            key={x}
            x={x}
            y="800"
            width="20"
            height="28"
            rx="3"
            fill="#eec37e"
            opacity="0.4"
          />
        ))}

        {/* right wing */}
        <rect
          x="940"
          y="700"
          width="300"
          height="300"
          fill="url(#buildingFace)"
        />
        <path d="M930 700 L1090 610 L1250 700 Z" fill="#232a52" />
        {[980, 1030, 1080, 1130, 1180].map((x) => (
          <rect
            key={x}
            x={x}
            y="760"
            width="20"
            height="28"
            rx="3"
            fill="#eec37e"
            opacity="0.4"
          />
        ))}

        {/* flag on main hall */}
        <line
          x1="730"
          y1="350"
          x2="730"
          y2="300"
          stroke="#eec37e"
          strokeWidth="3"
        />
        <path d="M730 300 L775 312 L730 324 Z" fill="#e0a458" />

        {/* ground line */}
        <rect x="0" y="980" width="1600" height="20" fill="#0e1130" />
      </g>

      {/* subtle foreground vignette so the card in front stays readable */}
      <rect width="1600" height="1000" fill="url(#vignette)" />
    </svg>
  );
}

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-ink-900 px-4 py-10">
      {/* Illustrated background */}
      <div className="absolute inset-0" aria-hidden="true">
        <AuthBackground />
        <div className="absolute -top-32 -left-24 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      {/* Logo, pinned top-left */}
      <div className="absolute top-5 left-4 sm:top-8 sm:left-8 flex items-center gap-2 z-10">
        <div className="h-9 w-9 rounded-lg bg-amber-400 flex items-center justify-center shrink-0">
          <GraduationCap size={20} className="text-ink-900" />
        </div>
        <span className="font-display text-xl text-white tracking-tight">
          EduBatch
        </span>
      </div>

      {/* Centered form card */}
      <div className="relative z-10 w-full max-w-md mt-16 sm:mt-0">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-6 sm:p-10">
          <h2 className="font-display text-xl sm:text-2xl text-ink-800 mb-1">
            {title}
          </h2>
          {subtitle ? (
            <p className="text-sm text-ink-400 mb-6">{subtitle}</p>
          ) : (
            <div className="mb-6" />
          )}
          {children}
        </div>
        <p className="text-center text-xs text-white/50 mt-6 px-4">
          Built for coaching institutes, tuition centers and small schools.
        </p>
      </div>
    </div>
  );
}
