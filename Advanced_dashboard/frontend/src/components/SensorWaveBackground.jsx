import React from "react";

/**
 * Faint sensor waveform / signal-line background for non-Home pages.
 * Extremely subtle: does not distract from data.
 */
export default function SensorWaveBackground({ variant = "waves" }) {
  return (
    <div className="sensor-waves" aria-hidden="true">
      <svg
        width="100%" height="100%" viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveA" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#0ea5e9" stopOpacity="0" />
            <stop offset="50%"  stopColor="#0ea5e9" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="waveB" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#8b5cf6" stopOpacity="0" />
            <stop offset="50%"  stopColor="#8b5cf6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="waveC" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#fbbf24" stopOpacity="0" />
            <stop offset="50%"  stopColor="#fbbf24" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[
          { color: "url(#waveA)", y: 220, amp: 40, phase: 0, dur: 24 },
          { color: "url(#waveB)", y: 460, amp: 60, phase: 1.4, dur: 30 },
          { color: "url(#waveC)", y: 700, amp: 50, phase: 0.7, dur: 28 },
        ].map((w, i) => (
          <g key={i}>
            <path
              d={buildWave(w.y, w.amp, w.phase)}
              stroke={w.color}
              strokeWidth="1.6"
              fill="none"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                from="-200 0"
                to="200 0"
                dur={`${w.dur}s`}
                repeatCount="indefinite"
              />
            </path>
          </g>
        ))}

        {/* tiny data dots */}
        {Array.from({ length: 30 }).map((_, i) => (
          <circle
            key={i}
            cx={(i * 53) % 1440}
            cy={(i * 71) % 900}
            r="1.5"
            fill="#0284c7"
            opacity="0.25"
          >
            <animate
              attributeName="opacity"
              values="0.05;0.35;0.05"
              dur={`${4 + (i % 5)}s`}
              repeatCount="indefinite"
              begin={`${i * 0.2}s`}
            />
          </circle>
        ))}
      </svg>
    </div>
  );
}

function buildWave(baseY, amp, phase) {
  const points = [];
  for (let x = -200; x <= 1640; x += 20) {
    const y = baseY + Math.sin((x / 120) + phase) * amp;
    points.push(`${x},${y}`);
  }
  return "M " + points.join(" L ");
}
