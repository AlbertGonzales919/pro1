"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase"; // adjust to your file path

const API_BASE = "http://127.0.0.1:8001";

type Sex = "male" | "female" | "other";
type NapHabit = "no" | "sometimes" | "daily";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return "Signup failed";
}

export default function SignupPage() {
  // account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // required
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<number>(18);
  const [sex, setSex] = useState<Sex>("male");
  const [sleepGoalHours, setSleepGoalHours] = useState<number>(8);
  const [bedTime, setBedTime] = useState("22:00");
  const [wakeTime, setWakeTime] = useState("06:00");

  // optional
  const [heightCm, setHeightCm] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [caffeinePerDay, setCaffeinePerDay] = useState<string>("");
  const [exercisePerWeek, setExercisePerWeek] = useState<string>("");
  const [alcoholPerWeek, setAlcoholPerWeek] = useState<string>("");
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [napHabit, setNapHabit] = useState<NapHabit>("no");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const parseNumOrNull = (s: string) => {
    const v = s.trim();
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const validate = () => {
    if (!email.trim()) return "Email is required.";
    if (!password.trim() || password.length < 6)
      return "Password must be at least 6 characters.";
    if (!fullName.trim()) return "Full name is required.";
    if (!Number.isFinite(age) || age < 1 || age > 120)
      return "Age must be between 1 and 120.";
    if (!Number.isFinite(sleepGoalHours) || sleepGoalHours <= 0 || sleepGoalHours > 16)
      return "Sleep goal hours must be between 1 and 16.";
    if (!bedTime) return "Bedtime is required.";
    if (!wakeTime) return "Wake time is required.";
    return "";
  };

  const onSubmit = async () => {
    setErr("");
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    setLoading(true);
    try {
      // 1) create firebase user
      await createUserWithEmailAndPassword(auth, email.trim(), password);

      // 2) send profile -> backend generates user CSVs
      const profile = {
        full_name: fullName.trim(),
        age: Number(age),
        sex,
        sleep_goal_hours: Number(sleepGoalHours),
        bed_time: bedTime,
        wake_time: wakeTime,

        height_cm: parseNumOrNull(heightCm),
        weight_kg: parseNumOrNull(weightKg),
        caffeine_per_day: parseNumOrNull(caffeinePerDay),
        exercise_per_week: parseNumOrNull(exercisePerWeek),
        alcohol_per_week: parseNumOrNull(alcoholPerWeek),
        stress_level: Number(stressLevel),
        nap_habit: napHabit,
      };

      const res = await fetch(`${API_BASE}/signup-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), profile }),
      });

      if (!res.ok) throw new Error(await res.text());

      // 3) go login (or dashboard)
      window.location.href = "/login";
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border bg-background shadow-sm">
          <div className="border-b px-6 py-5">
            <h1 className="text-2xl font-semibold">Create your SleepWell account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              We’ll use your profile to generate a personalized baseline dataset from our templates.
            </p>
          </div>

          <div className="px-6 py-6 space-y-8">
            {/* ACCOUNT */}
            <section>
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">ACCOUNT</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email *</label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password *</label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                    placeholder="At least 6 characters"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </section>

            {/* REQUIRED PROFILE */}
            <section>
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
                    PROFILE (REQUIRED)
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Used to select a matching template (sex + age + sleep goal hours).
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Full name *</label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Juan Dela Cruz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Age *</label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                    type="number"
                    min={1}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sex *</label>
                  <select
                    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                    value={sex}
                    onChange={(e) => setSex(e.target.value as Sex)}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sleep goal (hours) *</label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                    type="number"
                    min={1}
                    max={16}
                    step={0.5}
                    value={sleepGoalHours}
                    onChange={(e) => setSleepGoalHours(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Bedtime *</label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                    type="time"
                    value={bedTime}
                    onChange={(e) => setBedTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Wake time *</label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* OPTIONAL HABITS */}
            <section>
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">HABITS</h2>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Height (cm)</label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                    placeholder="170"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Weight (kg)</label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                    placeholder="65"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Caffeine / day</label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0 - 5"
                    value={caffeinePerDay}
                    onChange={(e) => setCaffeinePerDay(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Exercise / week</label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0 - 7"
                    value={exercisePerWeek}
                    onChange={(e) => setExercisePerWeek(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Alcohol / week</label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0 - 7"
                    value={alcoholPerWeek}
                    onChange={(e) => setAlcoholPerWeek(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Stress level (1–10)</label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                    type="number"
                    min={1}
                    max={10}
                    value={stressLevel}
                    onChange={(e) => setStressLevel(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Nap habit</label>
                  <select
                    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                    value={napHabit}
                    onChange={(e) => setNapHabit(e.target.value as NapHabit)}
                  >
                    <option value="no">No naps</option>
                    <option value="sometimes">Sometimes</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
              </div>
            </section>

            {/* ERROR + SUBMIT */}
            {err && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3">
                <div className="text-sm font-semibold text-destructive">Error</div>
                <pre className="mt-1 whitespace-pre-wrap text-xs text-destructive/90">{err}</pre>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                By signing up, you allow SleepWell to generate baseline analytics from templates.
              </p>
              <button
                onClick={onSubmit}
                disabled={loading}
                className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create account"}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <a className="underline" href="/login">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}