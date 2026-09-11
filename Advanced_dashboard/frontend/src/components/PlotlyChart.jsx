import React, { useRef } from "react";
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-dist-min";

const Plot = createPlotlyComponent(Plotly);

// Simple 4-corner "fullscreen" icon (Plotly SVG path spec)
const FULLSCREEN_ICON = {
  width: 500,
  height: 500,
  path:
    // Top-left corner
    "M0 0 h180 v40 h-140 v140 h-40 z " +
    // Top-right corner
    "M500 0 h-180 v40 h140 v140 h40 z " +
    // Bottom-left corner
    "M0 500 h180 v-40 h-140 v-140 h-40 z " +
    // Bottom-right corner
    "M500 500 h-180 v-40 h140 v-140 h40 z",
};

/**
 * Thin wrapper around Plotly:
 *   • Camera (Download PNG) always exports with a WHITE background
 *   • Adds a Fullscreen button that maximises the chart container
 */
export default function PlotlyChart({
  data,
  layout,
  height = 380,
  title,
  filename = "motionsense_plot",
  dataTestId,
}) {
  const containerRef = useRef(null);

  const mergedLayout = {
    autosize: true,
    height,
    margin: { l: 60, r: 30, t: title ? 40 : 20, b: 50 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(255,255,255,0.35)",
    font: {
      family: "Manrope, system-ui, sans-serif",
      color: "#0c4a6e",
      size: 12,
    },
    title: title
      ? {
          text: `<b>${title}</b>`,
          font: {
            family: "Bricolage Grotesque, system-ui, sans-serif",
            size: 15,
            color: "#0c4a6e",
          },
          x: 0.02,
          xanchor: "left",
        }
      : undefined,
    xaxis: {
      gridcolor: "rgba(2, 132, 199, 0.15)",
      zerolinecolor: "rgba(2, 132, 199, 0.25)",
      linecolor: "rgba(2, 132, 199, 0.35)",
      tickfont: { family: "JetBrains Mono, monospace", size: 11 },
      ...(layout?.xaxis || {}),
    },
    yaxis: {
      gridcolor: "rgba(2, 132, 199, 0.15)",
      zerolinecolor: "rgba(2, 132, 199, 0.25)",
      linecolor: "rgba(2, 132, 199, 0.35)",
      tickfont: { family: "JetBrains Mono, monospace", size: 11 },
      ...(layout?.yaxis || {}),
    },
    legend: {
      orientation: "v",
      x: 1.02,
      y: 1,
      xanchor: "left",
      yanchor: "top",
      bgcolor: "rgba(255,255,255,0.4)",
      bordercolor: "rgba(2, 132, 199, 0.25)",
      borderwidth: 1,
      font: { size: 11 },
      ...(layout?.legend || {}),
    },
    hoverlabel: {
      bgcolor: "rgba(255,255,255,0.95)",
      bordercolor: "#bae6fd",
      font: { family: "JetBrains Mono, monospace", size: 12, color: "#0c4a6e" },
    },
    ...layout,
  };

  const downloadPngButton = {
    name: "Download plot as PNG",
    title: "Download plot as PNG",
    icon: Plotly.Icons.camera,
    click: async (gd) => {
      const origPaper = gd.layout.paper_bgcolor;
      const origPlot  = gd.layout.plot_bgcolor;
      try {
        await Plotly.relayout(gd, {
          paper_bgcolor: "#ffffff",
          plot_bgcolor: "#ffffff",
        });
        await Plotly.downloadImage(gd, {
          format: "png",
          filename,
          scale: 2,
          width: gd.offsetWidth,
          height: gd.offsetHeight,
        });
      } finally {
        Plotly.relayout(gd, {
          paper_bgcolor: origPaper,
          plot_bgcolor: origPlot,
        });
      }
    },
  };

  const fullscreenButton = {
    name: "Fullscreen",
    title: "Toggle fullscreen",
    icon: FULLSCREEN_ICON,
    click: (gd) => {
      const el = containerRef.current || gd;
      if (!document.fullscreenElement) {
        (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
      } else {
        (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
      }
    },
  };

  const config = {
    displaylogo: false,
    responsive: true,
    displayModeBar: true,
    // Remove the default toImage — we replace it with our own white-bg version
    modeBarButtonsToRemove: ["lasso2d", "select2d", "toImage"],
    modeBarButtonsToAdd: [downloadPngButton, fullscreenButton],
  };

  return (
    <div
      ref={containerRef}
      data-testid={dataTestId}
      className="w-full plotly-chart-container"
      style={{ background: "transparent" }}
    >
      <Plot
        data={data}
        layout={mergedLayout}
        config={config}
        style={{ width: "100%", height: `${height}px` }}
        useResizeHandler
      />
    </div>
  );
}
