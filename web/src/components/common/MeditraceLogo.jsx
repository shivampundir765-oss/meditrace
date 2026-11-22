import React from 'react';

export default function MeditraceLogo({ className = "w-8 h-8", withText = false, textClassName = "text-xl" }) {
  return (
    <div className="flex items-center space-x-2.5">
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        <svg viewBox="0 0 512 512" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="navBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f766e" />
              <stop offset="50%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="navCrossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f0fdfa" />
            </linearGradient>
          </defs>

          {/* Squircle Background */}
          <rect x="24" y="24" width="464" height="464" rx="112" fill="url(#navBgGrad)" />
          <rect x="26" y="26" width="460" height="460" rx="110" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="4" />

          {/* Medical Cross */}
          <g transform="translate(256, 256)">
            <rect x="-38" y="-120" width="76" height="240" rx="36" fill="url(#navCrossGrad)" />
            <rect x="-120" y="-38" width="240" height="76" rx="36" fill="url(#navCrossGrad)" />

            {/* Angled Pill */}
            <g transform="rotate(-38)">
              <path d="M -70,-28 L 0,-28 L 0,28 L -70,28 C -85.46,28 -98,15.46 -98,0 C -98,-15.46 -85.46,-28 -70,-28 Z" fill="#0d9488" />
              <path d="M 0,-28 L 70,-28 C 85.46,-28 98,-15.46 98,0 C 98,15.46 85.46,28 70,28 L 0,28 Z" fill="#10b981" />
              <line x1="0" y1="-28" x2="0" y2="28" stroke="#ffffff" strokeWidth="4" strokeOpacity="0.85" />
            </g>

            {/* Dynamic ECG Trace Line */}
            <path d="M -130, 18 L -60, 18 L -28, -52 L 4, 68 L 36, -30 L 64, 18 L 130, 18"
                  fill="none" stroke="#0f172a" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
            <path d="M -130, 18 L -60, 18 L -28, -52 L 4, 68 L 36, -30 L 64, 18 L 130, 18"
                  fill="none" stroke="#ffffff" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Tracking Nodes */}
            <circle cx="-28" cy="-52" r="8" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="4" cy="68" r="8" fill="#06b6d4" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="36" cy="-30" r="8" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
          </g>
        </svg>
      </div>

      {withText && (
        <span className={`font-bold tracking-tight text-slate-900 ${textClassName}`}>
          Medi<span className="text-teal-600">trace</span>
        </span>
      )}
    </div>
  );
}
