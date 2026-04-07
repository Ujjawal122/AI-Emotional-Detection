"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import type { MoodSentiment } from "@/lib/moodTypes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Brain,
  ChevronDown,
  LogOut,
  Loader2,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  RotateCcw,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────
interface User {
  id?: string;
  _id?: string;
  username?: string;
  name?: string;
  email?: string;
}

// ─── Mood config ─────────────────────────────────────────
const MOODS = [
  { key: "happy",    emoji: "😊", label: "Happy",    color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.3)"  },
  { key: "excited",  emoji: "🤩", label: "Excited",  color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)"  },
  { key: "neutral",  emoji: "😐", label: "Neutral",  color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)" },
  { key: "sad",      emoji: "😢", label: "Sad",      color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)"  },
  { key: "low",      emoji: "😔", label: "Low",      color: "#94a3b8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.3)" },
  { key: "stressed", emoji: "😤", label: "Stressed", color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
  { key: "anxious",  emoji: "😰", label: "Anxious",  color: "#fb923c", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.3)"  },
  { key: "angry",    emoji: "😠", label: "Angry",    color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)"   },
] as const;

type MoodKey = MoodSentiment;

const INTENSITY_LABELS: Record<number, string> = {
  1: "Very mild", 2: "Mild", 3: "Noticeable", 4: "Moderate", 5: "Clear",
  6: "Strong", 7: "Very strong", 8: "Intense", 9: "Very intense", 10: "Overwhelming",
};

export default function MoodPage() {
  const router = useRouter();

  // Auth
  const [user,        setUser]        = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Form state
  const [text,              setText]              = useState("");
  const [selectedMood,      setSelectedMood]      = useState<MoodKey | null>(null);
  const [intensity,         setIntensity]         = useState(5);
  const [autoDetected,      setAutoDetected]      = useState<MoodKey | null>(null);
  const [detecting,         setDetecting]         = useState(false);
  const [saving,            setSaving]            = useState(false);
  const [saved,             setSaved]             = useState(false);
  const [error,             setError]             = useState("");

  // Background mood accent (follows selected mood)
  const activeMood = MOODS.find((m) => m.key === (selectedMood ?? autoDetected ?? "neutral")) ?? MOODS[2];

  const detectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detectRequestId = useRef(0);

  // Auth check
  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await axios.get<User>("/api/auth/me", { withCredentials: true });
        setUser(data);
      } catch {
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    };
    check();
  }, [router]);

  // Auto-detect mood as user types using the Gemini-backed API (debounced 800ms)
  useEffect(() => {
    if (detectTimer.current) clearTimeout(detectTimer.current);
    const trimmedText = text.trim();
    if (trimmedText.length < 10) {
      detectRequestId.current += 1;
      setAutoDetected(null);
      setDetecting(false);
      return;
    }

    setDetecting(true);
    detectTimer.current = setTimeout(() => {
      const requestId = ++detectRequestId.current;

      axios
        .post(
          "/api/mood/predict",
          { text: trimmedText },
          { withCredentials: true }
        )
        .then(({ data }) => {
          if (detectRequestId.current !== requestId) return;
          const detectedMood = typeof data?.mood === "string" ? (data.mood as MoodKey) : null;
          setAutoDetected(detectedMood);
        })
        .catch(() => {
          if (detectRequestId.current !== requestId) return;
          setAutoDetected(null);
        })
        .finally(() => {
          if (detectRequestId.current === requestId) {
            setDetecting(false);
          }
        });
    }, 800);

    return () => { if (detectTimer.current) clearTimeout(detectTimer.current); };
  }, [text]);

  const handleLogout = async () => {
    try { await axios.post("/api/auth/logout", {}, { withCredentials: true }); } catch { /* silent */ }
    router.push("/login");
  };

  const handleSave = async () => {
    const finalMood = selectedMood ?? autoDetected;
    if (!finalMood) { setError("Please write something or select a mood first."); return; }
    setError("");
    setSaving(true);
    try {
      await axios.post(
        "/api/mood",
        { text, sentiment: finalMood, intensity },
        { withCredentials: true }
      );
      setSaved(true);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? err.response?.data?.error ?? "Failed to save mood. Please try again."
          : "Failed to save mood. Please try again.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setText(""); setSelectedMood(null); setAutoDetected(null);
    setIntensity(5); setSaved(false); setError("");
  };

  const displayName = user?.username ?? user?.name;
  const initials    = displayName
    ? displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  // ── Full-page loader ──────────────────────────────────
  if (authLoading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
          body { margin: 0; background: #09090f; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div style={{ minHeight: "100vh", background: "#09090f", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 size={24} style={{ color: "#a78bfa", animation: "spin 0.9s linear infinite" }} />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #09090f; }

        .mp-root {
          font-family: 'DM Sa
          ns', sans-serif;
          min-height: 100vh;
          color: white;
          position: relative;
          overflow-x: hidden;
          transition: background 1.2s ease;
        }
        .lora { font-family: 'Lora', serif; }

        /* Orbs */
        .mp-orb {
          position: fixed; border-radius: 50%; filter: blur(90px);
          opacity: 0.15; pointer-events: none; z-index: 0;
          transition: background 1.2s ease;
        }
        .mp-grid {
          position: fixed; inset: 0; z-index: 0;
          background-image: radial-gradient(circle, rgba(167,139,250,0.055) 1px, transparent 1px);
          background-size: 36px 36px; pointer-events: none;
        }

        /* Navbar */
        .mp-nav {
          position: sticky; top: 0; z-index: 50;
          background: rgba(9,9,15,0.72);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .mp-nav-inner {
          max-width: 1100px; margin: 0 auto;
          padding: 0 24px; height: 58px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .mp-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .mp-logo-ring {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(167,139,250,0.12);
          border: 1.5px solid rgba(167,139,250,0.4);
          font-size: 14px;
          animation: mpSpin 14s linear infinite;
        }
        @keyframes mpSpin { to { transform: rotate(360deg); } }
        .mp-logo-text { font-family: 'Lora', serif; font-size: 19px; font-weight: 700; color: #a78bfa; }

        .mp-back {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: rgba(255,255,255,0.4);
          text-decoration: none; cursor: pointer;
          background: none; border: none;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.2s;
        }
        .mp-back:hover { color: #a78bfa; }

        .mp-user-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 12px 6px 6px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px; cursor: pointer;
          transition: background 0.2s; color: rgba(255,255,255,0.8);
          font-family: 'DM Sans', sans-serif; font-size: 13px;
        }
        .mp-user-btn:hover { background: rgba(255,255,255,0.09); }
        .mp-dropdown {
          background: #111120 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: white !important; min-width: 180px;
        }

        /* Main */
        .mp-main {
          position: relative; z-index: 10;
          max-width: 720px; margin: 0 auto;
          padding: 36px 24px 80px;
          animation: mpFadeUp 0.6s ease both;
        }
        @keyframes mpFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Card */
        .mp-card {
          background: rgba(255,255,255,0.035) !important;
          border: 1px solid rgba(255,255,255,0.09) !important;
          border-radius: 22px !important;
          backdrop-filter: blur(20px) !important;
          box-shadow: 0 24px 60px rgba(0,0,0,0.4) !important;
          overflow: hidden; position: relative;
          transition: border-color 1.2s ease !important;
        }
        .mp-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(167,139,250,0.4), transparent);
          pointer-events: none; transition: background 1.2s ease;
        }
        .mp-card-header { padding: 28px 28px 16px !important; border-bottom: 1px solid rgba(255,255,255,0.07); }
        .mp-card-title  { font-family: 'Lora', serif !important; font-size: 1.5rem !important; font-weight: 700 !important; color: white !important; }
        .mp-card-desc   { color: rgba(255,255,255,0.4) !important; font-size: 14px !important; margin-top: 5px !important; line-height: 1.6; }
        .mp-card-content { padding: 24px 28px 28px !important; }

        /* Textarea */
        .mp-textarea {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          line-height: 1.7;
          padding: 16px 18px;
          resize: none;
          transition: border-color 0.3s, background 0.3s, box-shadow 0.3s;
          outline: none;
        }
        .mp-textarea::placeholder { color: rgba(255,255,255,0.2); }
        .mp-textarea:focus {
          border-color: rgba(167,139,250,0.5);
          background: rgba(167,139,250,0.06);
          box-shadow: 0 0 0 3px rgba(167,139,250,0.1);
        }

        /* Auto-detect badge */
        .mp-detect-badge {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 14px; border-radius: 999px;
          font-size: 12px; font-weight: 500;
          transition: all 0.4s ease;
          animation: mpFadeUp 0.4s ease both;
        }

        /* Mood grid */
        .mp-mood-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        @media (max-width: 480px) {
          .mp-mood-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .mp-mood-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: 6px; padding: 14px 8px;
          border-radius: 14px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.04);
          font-family: 'DM Sans', sans-serif;
          transition: all 0.25s ease;
          position: relative; overflow: hidden;
        }
        .mp-mood-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-2px);
        }
        .mp-mood-btn.selected {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .mp-mood-btn.auto-detected::after {
          content: '✦';
          position: absolute; top: 6px; right: 7px;
          font-size: 8px; opacity: 0.8;
        }
        .mp-mood-emoji { font-size: 26px; line-height: 1; }
        .mp-mood-label { font-size: 11px; font-weight: 500; opacity: 0.8; }

        /* Intensity slider */
        .mp-slider {
          width: 100%; height: 5px;
          border-radius: 3px; outline: none;
          cursor: pointer; appearance: none;
          transition: background 0.5s ease;
        }
        .mp-slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px; height: 18px;
          border-radius: 50%; cursor: pointer;
          border: 2px solid #0a0a14;
          transition: background 0.5s ease, transform 0.2s;
        }
        .mp-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .mp-slider::-moz-range-thumb {
          width: 18px; height: 18px;
          border-radius: 50%; cursor: pointer;
          border: 2px solid #0a0a14;
        }

        /* Intensity dots */
        .mp-intensity-dots {
          display: flex; gap: 4px; align-items: center;
        }
        .mp-intensity-dot {
          width: 6px; height: 6px; border-radius: 50%;
          transition: all 0.3s ease;
        }

        /* Save button */
        .mp-save-btn {
          width: 100%; height: 48px;
          border-radius: 14px;
          font-size: 15px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; border: none;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s, background 1.2s ease;
        }
        .mp-save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(0,0,0,0.35); }
        .mp-save-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Reset btn */
        .mp-reset-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5);
          font-size: 12px; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.2s;
        }
        .mp-reset-btn:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.8); }

        /* Error */
        .mp-error {
          display: flex; align-items: flex-start; gap: 8px;
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.25);
          border-radius: 10px; padding: 10px 14px;
          color: #fca5a5; font-size: 13px; line-height: 1.5;
        }

        /* Success state */
        .mp-success {
          display: flex; flex-direction: column; align-items: center;
          gap: 14px; padding: 20px 0 8px; text-align: center;
          animation: mpFadeUp 0.5s ease both;
        }
        .mp-success-ring {
          width: 72px; height: 72px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 32px;
          animation: mpBounce 0.6s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes mpBounce {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* Section label */
        .mp-section-label {
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.15em;
          color: rgba(255,255,255,0.35); margin-bottom: 10px;
        }

        /* Mood strip */
        .mp-strip {
          display: flex; gap: 6px; align-items: center;
          padding: 14px 28px;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(167,139,250,0.04);
          transition: background 1.2s ease;
        }
        .mp-dot { width: 6px; height: 6px; border-radius: 50%; animation: mpPulse 2.4s ease-in-out infinite; }
        @keyframes mpPulse { 0%,100%{opacity:.3} 50%{opacity:1} }
        .mp-dot:nth-child(2) { animation-delay: 0.4s; }
        .mp-dot:nth-child(3) { animation-delay: 0.8s; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .mp-spinner { animation: spin 0.8s linear infinite; }

        /* Char count */
        .mp-char { font-size: 11px; color: rgba(255,255,255,0.25); text-align: right; margin-top: 6px; }
      `}</style>

      <div
        className="mp-root"
        style={{
          background: `linear-gradient(135deg, #09090f 0%, ${activeMood.bg.replace("0.12", "0.06")} 50%, #09090f 100%)`,
        }}
      >
        <div className="mp-grid" />
        {/* Orbs that shift with mood */}
        <div className="mp-orb" style={{ width: 500, height: 500, top: -160, left: -120, background: activeMood.border.replace("0.3", "1").replace("rgba", "rgb").replace(/,\s*[\d.]+\)/, ")"), opacity: 0.12, transition: "background 1.2s ease" }} />
        <div className="mp-orb" style={{ width: 380, height: 380, bottom: "5%", right: -100, background: activeMood.border.replace("0.3", "1").replace("rgba", "rgb").replace(/,\s*[\d.]+\)/, ")"), opacity: 0.08, transition: "background 1.2s ease" }} />

        {/* ── NAVBAR ── */}
        <nav className="mp-nav">
          <div className="mp-nav-inner">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button className="mp-back" onClick={() => router.push("/dashboard")}>
                <ArrowLeft size={14} /> Dashboard
              </button>
              <Link href="/" className="mp-logo">
                <div className="mp-logo-ring">🌀</div>
                <span className="mp-logo-text">EmoSoul</span>
              </Link>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="mp-user-btn">
                  <Avatar style={{ width: 28, height: 28 }}>
                    <AvatarFallback style={{ background: "rgba(167,139,250,0.2)", color: "#a78bfa", fontSize: 11, fontWeight: 700 }}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span style={{ maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {displayName ?? user?.email ?? "Account"}
                  </span>
                  <ChevronDown size={13} style={{ opacity: 0.5 }} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="mp-dropdown">
                <DropdownMenuLabel style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 400 }}>
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator style={{ background: "rgba(255,255,255,0.08)" }} />
                <DropdownMenuItem onClick={() => router.push("/dashboard")} style={{ cursor: "pointer", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator style={{ background: "rgba(255,255,255,0.08)" }} />
                <DropdownMenuItem onClick={handleLogout} style={{ cursor: "pointer", color: "#f87171", fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
                  <LogOut size={13} /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        {/* ── MAIN ── */}
        <main className="mp-main">
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: activeMood.color, marginBottom: 6, transition: "color 1.2s ease" }}>
            Mood Journal
          </p>
          <h1 className="lora" style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 700, marginBottom: 6 }}>
            How are you feeling{" "}
            <span style={{ color: activeMood.color, fontStyle: "italic", transition: "color 1.2s ease" }}>today?</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14, marginBottom: 28 }}>
            Share what&apos;s on your mind — our AI will detect your mood as you type.
          </p>

          <Card className="mp-card" style={{ borderColor: `${activeMood.border}` }}>
            <CardHeader className="mp-card-header">
              <CardTitle className="mp-card-title">
                {saved ? "Mood saved!" : "Log your mood"}
              </CardTitle>
              <CardDescription className="mp-card-desc">
                {saved
                  ? "Your mood entry has been recorded."
                  : "Write freely — the AI reads between the lines."}
              </CardDescription>
            </CardHeader>

            <CardContent className="mp-card-content">
              {saved ? (
                /* ── Success state ── */
                <div className="mp-success">
                  <div
                    className="mp-success-ring"
                    style={{ background: activeMood.bg, border: `2px solid ${activeMood.border}` }}
                  >
                    {activeMood.emoji}
                  </div>
                  <div>
                    <p className="lora" style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 6 }}>
                      Feeling{" "}
                      <span style={{ color: activeMood.color, transition: "color 1.2s ease" }}>
                        {activeMood.label}
                      </span>
                    </p>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 380, margin: "0 auto" }}>
                      Intensity {intensity}/10 — {INTENSITY_LABELS[intensity]}. Your mood has been saved to your journal.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
                    <button
                      onClick={handleReset}
                      style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 22px", background: activeMood.color, color: "#0a0a14", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "background 1.2s ease" }}
                    >
                      <TrendingUp size={14} /> Log another
                    </button>
                    <button
                      onClick={() => router.push("/dashboard")}
                      style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 22px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)", borderRadius: 12, fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

                  {/* ── Text input ── */}
                  <div>
                    <p className="mp-section-label">What&apos;s on your mind?</p>
                    <textarea
                      className="mp-textarea"
                      rows={5}
                      placeholder="I feel... Today was... Right now I'm thinking about..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      maxLength={1000}
                    />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                      {/* Auto-detect result */}
                      {detecting ? (
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 6 }}>
                          <Loader2 size={12} className="mp-spinner" /> Analysing...
                        </span>
                      ) : autoDetected ? (
                        <span
                          className="mp-detect-badge"
                          style={{
                            background: MOODS.find(m => m.key === autoDetected)?.bg,
                            border: `1px solid ${MOODS.find(m => m.key === autoDetected)?.border}`,
                            color: MOODS.find(m => m.key === autoDetected)?.color,
                          }}
                        >
                          <Brain size={11} />
                          AI detected: {MOODS.find(m => m.key === autoDetected)?.label}{" "}
                          {MOODS.find(m => m.key === autoDetected)?.emoji}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
                          {text.length < 10 ? "Keep writing…" : ""}
                        </span>
                      )}
                      <span className="mp-char">{text.length}/1000</span>
                    </div>
                  </div>

                  {/* ── Mood selector ── */}
                  <div>
                    <p className="mp-section-label">Select your mood</p>
                    <div className="mp-mood-grid">
                      {MOODS.map((mood) => {
                        const isSelected  = selectedMood === mood.key;
                        const isDetected  = !selectedMood && autoDetected === mood.key;
                        return (
                          <button
                            key={mood.key}
                            className={`mp-mood-btn ${isSelected ? "selected" : ""} ${isDetected ? "auto-detected" : ""}`}
                            style={
                              isSelected
                                ? { background: mood.bg, borderColor: mood.border, boxShadow: `0 0 0 2px ${mood.border}` }
                                : isDetected
                                ? { background: `${mood.bg.replace("0.12", "0.08")}`, borderColor: mood.border }
                                : {}
                            }
                            onClick={() => setSelectedMood(isSelected ? null : mood.key)}
                          >
                            <span className="mp-mood-emoji">{mood.emoji}</span>
                            <span
                              className="mp-mood-label"
                              style={{ color: isSelected || isDetected ? mood.color : "rgba(255,255,255,0.5)" }}
                            >
                              {mood.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedMood && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                        <button className="mp-reset-btn" onClick={() => setSelectedMood(null)}>
                          <RotateCcw size={11} /> Clear selection
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Intensity slider ── */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <p className="mp-section-label" style={{ margin: 0 }}>Intensity</p>
                      <span style={{ fontSize: 12, color: activeMood.color, fontWeight: 600, transition: "color 1.2s ease" }}>
                        {intensity}/10 — {INTENSITY_LABELS[intensity]}
                      </span>
                    </div>

                    {/* Dot visualiser */}
                    <div className="mp-intensity-dots" style={{ marginBottom: 10 }}>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className="mp-intensity-dot"
                          style={{
                            background: i < intensity ? activeMood.color : "rgba(255,255,255,0.1)",
                            width:  i < intensity ? 8 : 6,
                            height: i < intensity ? 8 : 6,
                            transition: "all 0.3s ease",
                          }}
                        />
                      ))}
                    </div>

                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={intensity}
                      onChange={(e) => setIntensity(Number(e.target.value))}
                      className="mp-slider"
                      style={{
                        background: `linear-gradient(to right, ${activeMood.color} ${(intensity - 1) * 11.1}%, rgba(255,255,255,0.1) ${(intensity - 1) * 11.1}%)`,
                      }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Very mild</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Overwhelming</span>
                    </div>
                  </div>

                  {/* ── Error ── */}
                  {error && (
                    <div className="mp-error">
                      <span style={{ marginTop: 1 }}>⚠</span>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* ── Save button ── */}
                  <button
                    className="mp-save-btn"
                    disabled={saving || (!text.trim() && !selectedMood)}
                    onClick={handleSave}
                    style={{ background: activeMood.color, color: "#0a0a14" }}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="mp-spinner" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Save mood entry
                      </>
                    )}
                  </button>

                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center", margin: 0 }}>
                    You can write without selecting a mood — AI will detect it automatically.
                  </p>
                </div>
              )}
            </CardContent>

            {/* Mood strip */}
            <div className="mp-strip" style={{ background: `${activeMood.bg.replace("0.12", "0.06")}` }}>
              <div className="mp-dot" style={{ background: activeMood.color, transition: "background 1.2s ease" }} />
              <div className="mp-dot" style={{ background: activeMood.color, opacity: 0.6, transition: "background 1.2s ease" }} />
              <div className="mp-dot" style={{ background: activeMood.color, opacity: 0.3, transition: "background 1.2s ease" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", letterSpacing: "0.02em", marginLeft: 4 }}>
                {detecting ? "Reading your emotions..." : saved ? "Mood recorded ✓" : (selectedMood ?? autoDetected) ? `Feeling ${activeMood.label.toLowerCase()} ${activeMood.emoji}` : "Start typing to detect your mood"}
              </span>
            </div>
          </Card>
        </main>
      </div>
    </>
  );
}
