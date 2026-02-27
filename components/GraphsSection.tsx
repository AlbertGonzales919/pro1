"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase/firebase";

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

const API_BASE = "https://expansionistic-giddier-shayne.ngrok-free.dev";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return "Failed to fetch";
}

async function fetchImageAsBlobUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Image fetch failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export default function GraphsSection({ email }: { email: string }) {
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // blob urls for images
  const [img1, setImg1] = useState<string>("");
  const [img2, setImg2] = useState<string>("");
  const [img3, setImg3] = useState<string>("");

  const cacheBust = useMemo(() => `t=${Date.now()}`, []);

  const analyze = async () => {
    setError("");
    setData(null);

    // cleanup previous blobs
    if (img1) URL.revokeObjectURL(img1);
    if (img2) URL.revokeObjectURL(img2);
    if (img3) URL.revokeObjectURL(img3);
    setImg1("");
    setImg2("");
    setImg3("");

    if (!email) {
      setError("No user email yet. Please wait for sign-in.");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");

      const url = `${API_BASE}/analyze-user/${encodeURIComponent(email)}`;

      const res = await fetch(url, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
        cache: "no-store",
      });

      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(
          `Expected JSON but got: ${contentType || "unknown content-type"}\n\n${text.slice(
            0,
            300
          )}`
        );
      }

      const json = (await res.json()) as Result;
      setData(json);

      // fetch plots as blob urls (so we can send ngrok headers)
      const p1 = `${API_BASE}${json.plots.plot1}?${cacheBust}`;
      const p2 = `${API_BASE}${json.plots.plot2}?${cacheBust}`;
      const p3 = `${API_BASE}${json.plots.plot3}?${cacheBust}`;

      const [b1, b2, b3] = await Promise.all([
        fetchImageAsBlobUrl(p1),
        fetchImageAsBlobUrl(p2),
        fetchImageAsBlobUrl(p3),
      ]);

      setImg1(b1);
      setImg2(b2);
      setImg3(b3);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Sleep Analytics (Personalized)</h2>
          <p className="text-sm text-muted-foreground">
            Signed-in user: {email || "(loading...)"}
          </p>
        </div>
        <Button onClick={analyze} disabled={loading || !email}>
          {loading ? "Analyzing..." : "Analyze my data"}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-xs text-destructive/90">
              {error}
            </pre>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Stat label="Minutes" value={`${data.minutes_analyzed}`} />
            <Stat label="Avg HR" value={`${data.avg_hr_minute_mean.toFixed(2)} bpm`} />
            <Stat label="True events" value={`${data.true_event_minutes}`} />
            <Stat label="Pred events" value={`${data.pred_event_minutes}`} />
            <Stat label="Sleep score" value={`${data.sleep_score.toFixed(1)}/100`} />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Plots</CardTitle>
              <CardDescription>Generated by backend and served as images.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!img1 || !img2 || !img3 ? (
                <div className="text-sm text-muted-foreground">
                  Loading plots...
                </div>
              ) : (
                <>
                  <img src={img1} className="w-full rounded-xl border" alt="plot1" />
                  <img src={img2} className="w-full rounded-xl border" alt="plot2" />
                  <img src={img3} className="w-full rounded-xl border" alt="plot3" />
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
