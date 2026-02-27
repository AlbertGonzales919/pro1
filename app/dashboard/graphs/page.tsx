"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

type Result = {
  minutes_analyzed: number;
  avg_hr_minute_mean: number;
  true_event_minutes: number;
  pred_event_minutes: number;
  event_rate_pred: number;
  sleep_score: number;
  target_col_used: string;
  plots: { plot1: string; plot2: string; plot3: string };
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return "Failed to load";
}

export default function GraphsPage() {
  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/analyze", { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const json = (await res.json()) as Result;
      setData(json);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Graphs</h1>

      <button
        onClick={load}
        disabled={loading}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #ddd",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: 16,
        }}
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>

      {error && (
        <div style={{ color: "crimson", whiteSpace: "pre-wrap", marginBottom: 16 }}>
          <b>Error:</b> {error}
        </div>
      )}

      {data && (
        <>
          <h2>Summary</h2>
          <ul>
            <li>Minutes analyzed: {data.minutes_analyzed}</li>
            <li>Avg HR (minute mean): {data.avg_hr_minute_mean.toFixed(2)} bpm</li>
            <li>True event-minutes: {data.true_event_minutes}</li>
            <li>Pred event-minutes: {data.pred_event_minutes}</li>
            <li>Event rate (pred): {(data.event_rate_pred * 100).toFixed(1)}%</li>
            <li>Sleep score: {data.sleep_score.toFixed(1)} / 100</li>
            <li>Target col used: {data.target_col_used}</li>
          </ul>

          <h2>Plots</h2>
          <div style={{ display: "grid", gap: 18, maxWidth: 1000 }}>
            <img
              src={`http://localhost:8000${data.plots.plot1}`}
              alt="Plot 1"
              style={{ width: "100%", border: "1px solid #eee", borderRadius: 12 }}
            />
            <img
              src={`http://localhost:8000${data.plots.plot2}`}
              alt="Plot 2"
              style={{ width: "100%", border: "1px solid #eee", borderRadius: 12 }}
            />
            <img
              src={`http://localhost:8000${data.plots.plot3}`}
              alt="Plot 3"
              style={{ width: "100%", border: "1px solid #eee", borderRadius: 12 }}
            />
          </div>
        </>
      )}
    </div>
  );
}