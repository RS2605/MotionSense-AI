import React, { useEffect, useState } from "react";

/**
 * Football that flies across the sky occasionally.
 * Uses a keyframe parabolic path + optional trail SVG.
 * Rendered ONLY on the Home page. Non-blocking (pointer-events:none).
 */
export default function FootballTrajectory() {
  const [flightKey, setFlightKey] = useState(0);

  useEffect(() => {
    // Football flies once immediately, then every ~22s
    const interval = setInterval(() => setFlightKey((k) => k + 1), 22000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="football-scene" aria-hidden="true" data-testid="football-trajectory">
      {/* Motion trail (SVG parabola) */}
      <svg
        className="ball-trail"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        key={`trail-${flightKey}`}
      >
        <defs>
          <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#fbbf24" stopOpacity="0.7" />
            <stop offset="50%"  stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <path
          d="M -6 60 Q 25 -12, 50 8 T 108 62"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* The football */}
      <div className="football" key={`ball-${flightKey}`} />
    </div>
  );
}
