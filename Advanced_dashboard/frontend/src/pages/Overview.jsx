import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Smartphone, Sparkles, Cog, BarChart3, BrainCircuit, Target,
  Users, Activity, Layers, Cpu, ArrowRight, TrendingUp
} from "lucide-react";
import SkyEnvironment from "../components/SkyEnvironment";
import FootballTrajectory from "../components/FootballTrajectory";
import { Stat, Card, Skeleton, Chip } from "../components/ui";
import { endpoints } from "../lib/api";

const PIPELINE_ICONS = {
  smartphone: Smartphone, sparkles: Sparkles, cog: Cog,
  "bar-chart": BarChart3, brain: BrainCircuit, target: Target,
};

export default function Overview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    endpoints.overview().then((r) => setData(r.data)).catch(() => {});
  }, []);

  return (
    <>
      {/* Home-only living background */}
      <SkyEnvironment />
      <FootballTrajectory />

      <section className="relative pt-8 md:pt-16 stagger" data-testid="hero-section">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 text-eyebrow">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
          <span>Live · Human Activity Recognition</span>
        </div>

        {/* Hero title */}
        <h1 className="title-hero text-[3.5rem] md:text-[6.2rem] mt-3">
          MotionSense<span className="italic-word">·ai</span>
        </h1>

        <p className="mt-5 max-w-2xl text-lg md:text-xl text-sky-ink/85 font-body leading-relaxed">
          Predicting human activity from smartphone{" "}
          <span className="font-semibold text-sky-deep">accelerometer</span> and{" "}
          <span className="font-semibold text-violet-bright">gyroscope</span> data —
          powered by a real trained Random Forest classifier.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/predict" className="btn-primary" data-testid="cta-predict">
            <Target size={18} /> Try Live Prediction <ArrowRight size={16} />
          </Link>
          <Link to="/eda" className="btn-ghost" data-testid="cta-eda">
            Explore the data
          </Link>
        </div>

        {/* Metric cards */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {data ? (
            <>
              <Stat testid="stat-readings"   label="Sensor Readings" value={data.total_readings.toLocaleString()} icon={Activity} accent="#0284c7" />
              <Stat testid="stat-subjects"   label="Subjects"       value={data.n_subjects}   icon={Users}    accent="#8b5cf6" />
              <Stat testid="stat-activities" label="Activities"     value={data.n_activities} icon={Layers}   accent="#f59e0b" />
              <Stat testid="stat-devices"    label="Devices"        value={data.n_devices}    icon={Smartphone} accent="#06b6d4" />
              <Stat testid="stat-accuracy"   label="Model Accuracy" value={data.model_accuracy} unit="%" icon={TrendingUp} accent="#22c55e" />
            </>
          ) : (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          )}
        </div>

        {/* Pipeline */}
        <div className="mt-14" data-testid="pipeline">
          <div className="text-eyebrow mb-4">The MotionSense·AI Pipeline</div>
          <Card className="!p-6 md:!p-8">
            <div className="flex items-stretch gap-3 flex-wrap md:flex-nowrap overflow-x-auto">
              {(data?.pipeline ?? []).map((step, i, arr) => {
                const Icon = PIPELINE_ICONS[step.icon] ?? Cog;
                return (
                  <React.Fragment key={step.label}>
                    <div className="flex-1 min-w-[130px] flex flex-col items-center text-center gap-2 py-3 px-2 rounded-2xl transition hover:bg-white/40">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, hsl(${200 + i * 25} 90% 62%) 0%, hsl(${240 + i * 15} 80% 65%) 100%)`,
                          color: "white",
                          boxShadow: "0 6px 16px rgba(14,165,233,0.35)",
                        }}
                      >
                        <Icon size={20} strokeWidth={2.2} />
                      </div>
                      <div className="font-display font-semibold text-sm text-sky-ink">
                        {step.label}
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="hidden md:flex items-center text-sky-deep/50">
                        <ArrowRight size={18} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Activity chips */}
        {data && (
          <div className="mt-8 flex flex-wrap gap-2 items-center" data-testid="activity-chips">
            <span className="text-eyebrow mr-2">Predictable Activities:</span>
            {data.activities.map((a) => (
              <Chip key={a} color="#0284c7">{a}</Chip>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
