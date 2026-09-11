import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TopNav from "./components/TopNav";
import Overview from "./pages/Overview";
import DataExplorer from "./pages/DataExplorer";
import EDA from "./pages/EDA";
import ModelPerformance from "./pages/ModelPerformance";
import LivePrediction from "./pages/LivePrediction";

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-screen font-body">
        <TopNav />
        <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-16">
          <Routes>
            <Route path="/"        element={<Overview />} />
            <Route path="/data"    element={<DataExplorer />} />
            <Route path="/eda"     element={<EDA />} />
            <Route path="/model"   element={<ModelPerformance />} />
            <Route path="/predict" element={<LivePrediction />} />
          </Routes>
        </main>
        <footer className="relative z-10 pb-6 text-center text-xs font-mono tracking-widest uppercase text-sky-deep/60">
          MotionSense·AI — Random Forest Classifier · Real Sensor Data · Built with React + FastAPI
        </footer>
      </div>
    </BrowserRouter>
  );
}
