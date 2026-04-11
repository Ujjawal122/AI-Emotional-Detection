"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  Palette,
  Lock,
  MessageCircle,
  FolderOpen,
  TrendingUp,
  LogOut,
  LogIn,
  UserPlus,
  Sparkles,
  ChevronDown,
  Loader2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────
interface User {
  id: string;
  name?: string;
  email?: string;
}

// ─── Mood config ────────────────────────────────────────
const MOODS = {
  neutral: {
    bg: "from-[#09090f] via-[#0d0d1c] to-[#09090f]",
    orb1: "#1a1a3e",
    orb2: "#111130",
    accent: "#a78bfa",        // violet
    accentRgb: "167,139,250",
    label: "",
    emoji: "",
  },
  happy: {
    bg: "from-[#081208] via-[#0c1a10] to-[#081208]",
    orb1: "#183b1a",
    orb2: "#0e2814",
    accent: "#34d399",        // emerald
    accentRgb: "52,211,153",
    label: "😊 You seem happy!",
    emoji: "😊",
  },
  sad: {
    bg: "from-[#08080f] via-[#0c0f1f] to-[#08080f]",
    orb1: "#0f1d40",
    orb2: "#0a1030",
    accent: "#60a5fa",        // sky blue
    accentRgb: "96,165,250",
    label: "💙 I feel your sadness...",
    emoji: "💙",
  },
} as const;

type MoodKey = keyof typeof MOODS;

// ─── Feature data ────────────────────────────────────────
const FEATURES = [
  {
    icon: Brain,
    title: "Emotion Detection",
    desc: "Our AI reads your words and understands how you truly feel — happy, sad, anxious, or at peace in real time.",
  },
  {
    icon: Palette,
    title: "Adaptive Ambience",
    desc: "Your environment shifts with your mood. Calming blues when you're down, vibrant greens when you're joyful.",
  },
  {
    icon: Lock,
    title: "Private & Secure",
    desc: "Upload personal documents and memories. Everything stays encrypted — only you can access it.",
  },
  {
    icon: MessageCircle,
    title: "Talk Anytime",
    desc: "Your AI companion is always there. No judgment, no wait time. Just an open, empathetic conversation.",
  },
  {
    icon: FolderOpen,
    title: "Personal Memory",
    desc: "Upload journals, notes, and documents. The AI remembers what matters to you and speaks your language.",
  },
  {
    icon: TrendingUp,
    title: "Grow Over Time",
    desc: "Track emotional patterns across weeks and months. Understand yourself better than ever before.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Upload Your World",
    desc: "Share documents, journals, and personal context. Your AI builds a deep understanding of who you are.",
  },
  {
    num: "02",
    title: "Have a Conversation",
    desc: "Talk freely. Share your thoughts. The AI listens, reads between the lines, and understands your emotional state.",
  },
  {
    num: "03",
    title: "Feel the Difference",
    desc: "Your environment adapts. Colours shift. The tone softens or brightens. You are truly heard.",
  },
];

// ─── Main Component ──────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mood, setMood] = useState<MoodKey>("neutral");
  const [demoText, setDemoText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [moodLabel, setMoodLabel] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);

  // ── Check auth via /api/auth/me ────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await axios.get("/api/auth/me", {
          withCredentials: true,
        });
        setUser(data);
      } catch {
        // 401 = not logged in — silent
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // ── Scroll listener for frosted navbar ─────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Logout ─────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
    } catch {
      // ignore
    }
    setUser(null);
    router.refresh();
  };

  // ── Mood analysis ──────────────────────────────────────
  const analyzeMood = () => {
    if (!demoText.trim()) return;
    setAnalyzing(true);
    setMoodLabel("");
    setTimeout(() => {
      const lower = demoText.toLowerCase();
      const happyWords = ["happy", "joy", "love", "great", "excited", "good", "amazing", "wonderful", "smile", "laugh", "grateful", "fantastic", "glad", "blessed", "cheerful", "elated"];
      const sadWords = ["sad", "cry", "miss", "lonely", "hurt", "tired", "lost", "pain", "broken", "hopeless", "empty", "down", "bad", "scared", "anxious", "worried", "depressed", "grief"];
      const h = happyWords.filter((w) => lower.includes(w)).length;
      const s = sadWords.filter((w) => lower.includes(w)).length;
      const detected: MoodKey = h > s ? "happy" : s > h ? "sad" : "neutral";
      setMood(detected);
      setMoodLabel(MOODS[detected].label);
      setAnalyzing(false);
    }, 1400);
  };

  const cm = MOODS[mood];
  const userInitials = user?.name ? user.name.slice(0, 2).toUpperCase() : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <>
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        body { margin: 0; background: #09090f; }

        .lora { font-family: 'Lora', serif; }
        .dm { font-family: 'DM Sans', sans-serif; }

        .page-root {
          font-family: 'DM Sans', sans-serif;
          color: white;
          overflow-x: hidden;
          min-height: 100vh;
          transition: background 1.2s ease;
        }

        /* orbs */
        .orb {
          position: fixed; border-radius: 50%; filter: blur(90px);
          opacity: 0.16; pointer-events: none; z-index: 0;
          transition: background 1.4s ease;
        }

        /* navbar */
        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          transition: background 0.4s, border-color 0.4s, backdrop-filter 0.4s;
        }
        .navbar.scrolled {
          background: rgba(9,9,15,0.72);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        /* animations */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu  { animation: fadeUp 0.7s ease both; }
        .fu1 { animation: fadeUp 0.7s 0.12s ease both; }
        .fu2 { animation: fadeUp 0.7s 0.24s ease both; }
        .fu3 { animation: fadeUp 0.7s 0.36s ease both; }

        @keyframes spinSlow { to { transform: rotate(360deg); } }
        .spin { animation: spinSlow 14s linear infinite; }

        @keyframes pulseDot { 0%,100%{opacity:.5} 50%{opacity:1} }
        .pulse-dot { animation: pulseDot 2.4s ease-in-out infinite; }

        /* shadcn overrides for dark theme */
        .dark-card {
          background: rgba(255,255,255,0.04) !important;
          border: 1px solid rgba(255,255,255,0.09) !important;
          border-radius: 18px !important;
          backdrop-filter: blur(12px);
          transition: background 0.3s, border-color 0.3s, transform 0.3s;
        }
        .dark-card:hover {
          background: rgba(255,255,255,0.07) !important;
          border-color: rgba(255,255,255,0.16) !important;
          transform: translateY(-4px);
        }

        .demo-textarea {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid rgba(255,255,255,0.12) !important;
          border-radius: 0 !important;
          color: white !important;
          resize: none;
          font-size: 15px;
          padding-left: 0 !important;
          box-shadow: none !important;
        }
        .demo-textarea::placeholder { color: rgba(255,255,255,0.2); }
        .demo-textarea:focus { box-shadow: none !important; border-bottom-color: rgba(255,255,255,0.3) !important; }

        .accent-btn {
          font-weight: 600;
          transition: background 1.2s ease, transform 0.2s, box-shadow 0.2s;
        }
        .accent-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.4);
        }

        .ghost-btn {
          background: rgba(255,255,255,0.06) !important;
          border: 1px solid rgba(255,255,255,0.14) !important;
          color: rgba(255,255,255,0.8) !important;
          transition: background 0.2s, transform 0.2s;
        }
        .ghost-btn:hover {
          background: rgba(255,255,255,0.11) !important;
          transform: translateY(-1px);
        }

        .mood-track { display:flex; gap:8px; align-items:center; }
        .mood-pip {
          height: 3px; border-radius: 2px; flex: 1;
          transition: background 1.2s ease, height 0.4s ease;
        }
        .mood-pip-label {
          font-size: 11px; text-transform: capitalize;
          transition: color 1.2s ease;
          min-width: 38px; text-align: right;
        }

        .step-num {
          font-family: 'Lora', serif;
          font-size: 3.5rem;
          font-weight: 700;
          line-height: 1;
          transition: color 1.2s ease;
        }

        .cta-box {
          border-radius: 28px;
          transition: background 1.2s ease, border-color 1.2s ease;
        }

        .logo-ring {
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: background 1.2s ease, border-color 1.2s ease;
        }
      `}</style>

      <div
        className={`page-root bg-gradient-to-br ${cm.bg}`}
        style={{ transition: "all 1.2s ease" }}
      >
        {/* Orbs */}
        <div className="orb" style={{ width: 620, height: 620, top: -160, left: -160, background: cm.orb1 }} />
        <div className="orb" style={{ width: 500, height: 500, bottom: "8%", right: -100, background: cm.orb2 }} />

        {/* ─── NAVBAR ─── */}
        <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                className="logo-ring spin"
                style={{
                  width: 34, height: 34, fontSize: 15,
                  background: `${cm.accent}18`,
                  border: `1.5px solid ${cm.accent}50`,
                }}
              >
                🌀
              </div>
              <span className="lora" style={{ fontSize: 20, fontWeight: 700, color: cm.accent, transition: "color 1.2s ease" }}>
                EmoSoul
              </span>
            </div>

            {/* Auth controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {authLoading ? (
                <Loader2 size={18} style={{ opacity: 0.4, animation: "spinSlow 1s linear infinite" }} />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999 }}>
                      <Avatar style={{ width: 26, height: 26 }}>
                        <AvatarFallback style={{ background: cm.accent, color: "#0a0a14", fontSize: 11, fontWeight: 700, transition: "background 1.2s ease" }}>
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span style={{ fontSize: 13 }}>{user.name ?? user.email ?? "Account"}</span>
                      <ChevronDown size={14} style={{ opacity: 0.5 }} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.1)", color: "white", minWidth: 180 }}>
                    <DropdownMenuLabel style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator style={{ background: "rgba(255,255,255,0.08)" }} />
                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard")}
                      style={{ cursor: "pointer",  }}
                    >
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/profile")}
                      style={{ cursor: "pointer",  }}
                    >
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator style={{ background: "rgba(255,255,255,0.08)" }} />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      style={{ cursor: "pointer", color: "#f87171", display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <LogOut size={13} /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                   
                    className="ghost-btn"
                    style={{ borderRadius: 999, fontSize: 13 }}
                    onClick={() => router.push("/login")}
                  >
                    <LogIn size={14} style={{ marginRight: 6 }} />
                    Login
                  </Button>
                  <Button
                    className="accent-btn"
                    style={{ borderRadius: 999, fontSize: 13, background: cm.accent, color: "#0a0a14" }}
                    onClick={() => router.push("/signup")}
                  >
                    <UserPlus size={14} style={{ marginRight: 6 }} />
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* ─── HERO ─── */}
        <section style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px" }}>
          
          

          <h1
            className="lora fu1"
            style={{ fontSize: "clamp(2.6rem, 6vw, 4.8rem)", fontWeight: 700, lineHeight: 1.15, maxWidth: 820, marginBottom: 22 }}
          >
            Your mind has a{" "}
            <span style={{ color: cm.accent, transition: "color 1.2s ease", fontStyle: "italic" }}>language.</span>
            <br />
            We speak it.
          </h1>

          <p
            className="fu2"
            style={{ fontSize: "clamp(1rem, 2vw, 1.18rem)", color: "rgba(255,255,255,0.5)", lineHeight: 1.75, maxWidth: 560, marginBottom: 36 }}
          >
            EmoSoul is an emotional AI companion that reads your words, understands your feelings, and transforms your environment — adapting in real time to how you feel.
          </p>

          <div className="fu3" style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
            <Button
              size="lg"
              className="accent-btn"
              style={{ borderRadius: 999, fontSize: 15, padding: "14px 32px", background: cm.accent, color: "#0a0a14" }}
              onClick={() => router.push(user ? "/dashboard" : "/signup")}
            >
              <Sparkles size={16} style={{ marginRight: 7 }} />
              {user ? "Go to Dashboard" : "Get Started Free"}
            </Button>
            <Button
              size="lg"
             
              className="ghost-btn"
              style={{ borderRadius: 999, fontSize: 15, padding: "14px 32px" }}
              onClick={() => demoRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              Try the Demo ↓
            </Button>
          </div>

          {/* scroll cue */}
          <div style={{ position: "absolute", bottom: 36, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: 0.25 }}>
            <div style={{ width: 1, height: 40, background: "white" }} />
            <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}>scroll</span>
          </div>
        </section>
        {/* ─── LIVE DEMO (guests) / WELCOME BACK (logged-in) ─── */}
        {user ? (
          /* ── Logged-in: quick-access dashboard card ── */
          <section ref={demoRef} style={{ position: "relative", zIndex: 10, padding: "80px 24px 100px" }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <p style={{ textAlign: "center", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: cm.accent, marginBottom: 10, transition: "color 1.2s ease" }}>
                Welcome Back
              </p>
              <h2 className="lora" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, textAlign: "center", marginBottom: 10 }}>
                Ready to continue,{" "}
                <span style={{ color: cm.accent, transition: "color 1.2s ease", fontStyle: "italic" }}>
                  {user.name ?? user.email?.split("@")[0] ?? "friend"}?
                </span>
              </h2>
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", marginBottom: 36, lineHeight: 1.7 }}>
                Head to your dashboard to continue your emotional journey.
              </p>
              <Card
                className="dark-card"
                style={{ background: "rgba(9,9,15,0.82)", border: `1px solid ${cm.accent}28`, borderRadius: 22, overflow: "hidden", transition: "border-color 1.2s ease" }}
              >
                <CardContent style={{ padding: "32px 28px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                    {([
                      { icon: Brain, label: "Start a Chat", sub: "Talk to your AI", route: "/chat" },
                      { icon: FolderOpen, label: "My Documents", sub: "Upload & manage files", route: "/documents" },
                      { icon: TrendingUp, label: "Mood History", sub: "See your patterns", route: "/dashboard" },
                      { icon: MessageCircle, label: "Profile", sub: "Manage your account", route: "/profile" },
                    ] as const).map((item) => (
                      <button
                        key={item.label}
                        onClick={() => router.push(item.route)}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: `${cm.accent}0d`, border: `1px solid ${cm.accent}20`, borderRadius: 14, cursor: "pointer", transition: "background 0.2s, border-color 0.2s, transform 0.2s", textAlign: "left" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${cm.accent}1a`; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${cm.accent}0d`; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cm.accent}18`, border: `1px solid ${cm.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 1.2s ease" }}>
                          <item.icon size={16} style={{ color: cm.accent, transition: "color 1.2s ease" }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: 0 }}>{item.label}</p>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0, marginTop: 2 }}>{item.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <Button
                    className="accent-btn"
                    style={{ width: "100%", height: 46, borderRadius: 12, fontSize: 14, background: cm.accent, color: "#0a0a14" }}
                    onClick={() => router.push("/dashboard")}
                  >
                    <Sparkles size={15} style={{ marginRight: 7 }} />
                    Open Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        ) : (
          /* ── Guest: live mood demo ── */
          <section ref={demoRef} style={{ position: "relative", zIndex: 10, padding: "80px 24px 100px" }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <p style={{ textAlign: "center", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: cm.accent, marginBottom: 10, transition: "color 1.2s ease" }}>
                Live Demo
              </p>
              <h2 className="lora" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, textAlign: "center", marginBottom: 10 }}>
                Tell me how you feel
              </h2>
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", marginBottom: 36, lineHeight: 1.7 }}>
                Type anything — a feeling, a thought, a sentence. Watch the world around you change.
              </p>
              <Card
                className="dark-card"
                style={{ background: "rgba(9,9,15,0.82)", border: `1px solid ${cm.accent}28`, borderRadius: 22, overflow: "hidden", transition: "border-color 1.2s ease" }}
              >
                <CardContent style={{ padding: "28px 28px 20px" }}>
                  <Textarea
                    className="demo-textarea"
                    rows={4}
                    placeholder="e.g. I feel so happy today, everything is going so well..."
                    value={demoText}
                    onChange={(e) => setDemoText(e.target.value)}
                  />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
                    <span style={{ fontSize: 13, color: cm.accent, minHeight: 20, transition: "color 1.2s ease" }}>
                      {moodLabel}
                    </span>
                    <Button
                      className="accent-btn"
                      disabled={analyzing || !demoText.trim()}
                      style={{ borderRadius: 999, fontSize: 13, background: cm.accent, color: "#0a0a14", minWidth: 138 }}
                      onClick={analyzeMood}
                    >
                      {analyzing ? (
                        <>
                          <Loader2 size={14} style={{ marginRight: 6, animation: "spinSlow 0.8s linear infinite" }} />
                          Reading...
                        </>
                      ) : (
                        <>
                          <Brain size={14} style={{ marginRight: 6 }} />
                          Analyse Mood →
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <div className="mood-track" style={{ marginTop: 14, padding: "0 4px" }}>
                {(["happy", "neutral", "sad"] as MoodKey[]).map((m) => (
                  <div key={m} style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                    <div className="mood-pip" style={{ background: mood === m ? MOODS[m].accent : "rgba(255,255,255,0.1)", height: mood === m ? 4 : 2 }} />
                    <span className="mood-pip-label" style={{ color: mood === m ? MOODS[m].accent : "rgba(255,255,255,0.22)" }}>
                      {m}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── HOW IT WORKS ─── */}
        <section style={{ position: "relative", zIndex: 10, padding: "60px 24px 90px" }}>
          <div style={{ maxWidth: 1060, margin: "0 auto" }}>
            <p style={{ textAlign: "center", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: cm.accent, marginBottom: 10, transition: "color 1.2s ease" }}>
              How It Works
            </p>
            <h2 className="lora" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, textAlign: "center", marginBottom: 52 }}>
              Simple. Powerful. Personal.
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              {STEPS.map((s) => (
                <Card key={s.num} className="dark-card">
                  <CardHeader>
                    <div className="step-num" style={{ color: `${cm.accent}2e`, marginBottom: 10, transition: "color 1.2s ease" }}>
                      {s.num}
                    </div>
                    <CardTitle style={{ color: "white", fontSize: 17 }}>{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription style={{ color: "rgba(255,255,255,0.42)", lineHeight: 1.75, fontSize: 14 }}>
                      {s.desc}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <Separator style={{ background: "rgba(255,255,255,0.06)", maxWidth: 1060, margin: "0 auto" }} />

        {/* ─── FEATURES ─── */}
        <section style={{ position: "relative", zIndex: 10, padding: "80px 24px 90px" }}>
          <div style={{ maxWidth: 1060, margin: "0 auto" }}>
            <p style={{ textAlign: "center", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: cm.accent, marginBottom: 10, transition: "color 1.2s ease" }}>
              Features
            </p>
            <h2 className="lora" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, textAlign: "center", marginBottom: 52 }}>
              Built for emotional wellness
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
              {FEATURES.map((f) => (
                <Card key={f.title} className="dark-card">
                  <CardHeader>
                    <div
                      style={{
                        width: 44, height: 44, borderRadius: 12,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: `${cm.accent}16`,
                        border: `1px solid ${cm.accent}28`,
                        marginBottom: 8,
                        transition: "background 1.2s ease, border-color 1.2s ease",
                      }}
                    >
                      <f.icon size={20} style={{ color: cm.accent, transition: "color 1.2s ease" }} />
                    </div>
                    <CardTitle style={{ color: "white", fontSize: 16 }}>{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription style={{ color: "rgba(255,255,255,0.42)", lineHeight: 1.75, fontSize: 14 }}>
                      {f.desc}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA BANNER ─── */}
        <section style={{ position: "relative", zIndex: 10, padding: "40px 24px 90px" }}>
          <div
            className="cta-box"
            style={{
              maxWidth: 720,
              margin: "0 auto",
              padding: "clamp(40px, 6vw, 64px)",
              textAlign: "center",
              background: `linear-gradient(135deg, ${cm.accent}14, rgba(255,255,255,0.025))`,
              border: `1px solid ${cm.accent}2e`,
            }}
          >
            <h2 className="lora" style={{ fontSize: "clamp(1.7rem, 4vw, 2.6rem)", fontWeight: 700, marginBottom: 14 }}>
              Your emotions deserve to be{" "}
              <em style={{ color: cm.accent, transition: "color 1.2s ease" }}>understood.</em>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.75, marginBottom: 32, fontSize: 15 }}>
              Join thousands already experiencing the calm of being truly heard. Start for free — no credit card needed.
            </p>
            <Button
              size="lg"
              className="accent-btn"
              style={{ borderRadius: 999, fontSize: 15, padding: "14px 36px", background: cm.accent, color: "#0a0a14" }}
              onClick={() => router.push(user ? "/dashboard" : "/signup")}
            >
              <Sparkles size={16} style={{ marginRight: 8 }} />
              {user ? "Open Dashboard" : "Begin Your Journey →"}
            </Button>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer style={{ position: "relative", zIndex: 10, borderTop: "1px solid rgba(255,255,255,0.07)", padding: "28px 24px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
            <span className="lora" style={{ fontWeight: 700, fontSize: 16, color: cm.accent, transition: "color 1.2s ease" }}>EmoSoul</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Emotionally intelligent AI</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>
            © {new Date().getFullYear()} EmoSoul. All rights reserved.
          </p>
        </footer>
      </div>
    </>
  );
}