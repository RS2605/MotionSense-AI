import React from "react";

/**
 * Living sky background — drifting clouds + sun glow + light particles.
 * Rendered on Home page. Pure CSS animations (lightweight).
 */
export default function SkyEnvironment() {
  const particles = Array.from({ length: 14 });
  return (
    <div className="sky-env" aria-hidden="true">
      {/* Sun */}
      <div className="sun" />

      {/* Cloud layer 1 - slow, large */}
      <div
        className="cloud animate-cloud-slow"
        style={{ top: "12%", width: 340, height: 90, opacity: 0.85 }}
      />
      <div
        className="cloud animate-cloud-slow"
        style={{ top: "38%", width: 260, height: 70, opacity: 0.7, animationDelay: "-30s" }}
      />
      <div
        className="cloud animate-cloud-slow"
        style={{ top: "68%", width: 400, height: 110, opacity: 0.6, animationDelay: "-60s" }}
      />

      {/* Cloud layer 2 - medium */}
      <div
        className="cloud animate-cloud-med"
        style={{ top: "22%", width: 200, height: 55, opacity: 0.75, animationDelay: "-15s" }}
      />
      <div
        className="cloud animate-cloud-med"
        style={{ top: "55%", width: 220, height: 60, opacity: 0.65, animationDelay: "-40s" }}
      />

      {/* Cloud layer 3 - fast, small (parallax) */}
      <div
        className="cloud animate-cloud-fast"
        style={{ top: "5%", width: 120, height: 34, opacity: 0.8, animationDelay: "-10s" }}
      />
      <div
        className="cloud animate-cloud-fast"
        style={{ top: "45%", width: 140, height: 40, opacity: 0.7, animationDelay: "-25s" }}
      />
      <div
        className="cloud animate-cloud-fast"
        style={{ top: "80%", width: 160, height: 44, opacity: 0.5, animationDelay: "-35s" }}
      />

      {/* Floating light particles */}
      <div className="particles">
        {particles.map((_, i) => (
          <span
            key={i}
            className="particle"
            style={{
              left: `${(i * 7 + 3) % 100}%`,
              animationDelay: `${-i * 1.3}s`,
              animationDuration: `${10 + (i % 5) * 2}s`,
              width: `${3 + (i % 3)}px`,
              height: `${3 + (i % 3)}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
