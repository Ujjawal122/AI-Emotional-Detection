"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MOODS, type MoodSentiment } from "@/lib/moodTypes";
import { ArrowLeft, Bot, Brain, ChevronDown, Loader2, LogOut, RefreshCw, Send, User } from "lucide-react";

type UserRecord = { username?: string; name?: string; email?: string };
type ChatMessage = { role: "user" | "assistant"; content: string };
type MoodCoachResponse = {
  reply: string;
  nextAction?: { title?: string; steps?: string[]; journalPrompt?: string };
  followUpQuestion?: string;
};
type MoodPrediction = { mood: MoodSentiment; confidence: number; rationale?: string };

const VISUALS: Record<MoodSentiment, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  happy: { label: "Happy", emoji: "😊", color: "#34d399", bg: "rgba(52,211,153,0.14)", border: "rgba(52,211,153,0.28)" },
  low: { label: "Low", emoji: "😔", color: "#94a3b8", bg: "rgba(148,163,184,0.14)", border: "rgba(148,163,184,0.28)" },
  neutral: { label: "Neutral", emoji: "😐", color: "#a78bfa", bg: "rgba(167,139,250,0.14)", border: "rgba(167,139,250,0.28)" },
  stressed: { label: "Stressed", emoji: "😤", color: "#f87171", bg: "rgba(248,113,113,0.14)", border: "rgba(248,113,113,0.28)" },
  anxious: { label: "Anxious", emoji: "😰", color: "#fb923c", bg: "rgba(251,146,60,0.14)", border: "rgba(251,146,60,0.28)" },
  excited: { label: "Excited", emoji: "🤩", color: "#fbbf24", bg: "rgba(251,191,36,0.14)", border: "rgba(251,191,36,0.28)" },
  angry: { label: "Angry", emoji: "😠", color: "#ef4444", bg: "rgba(239,68,68,0.14)", border: "rgba(239,68,68,0.28)" },
  sad: { label: "Sad", emoji: "😢", color: "#60a5fa", bg: "rgba(96,165,250,0.14)", border: "rgba(96,165,250,0.28)" },
};

const STARTERS = [
  "I feel overwhelmed and I cannot focus today.",
  "I am excited but also nervous about what is next.",
  "I have been low for a few days and need help resetting.",
];

const INITIAL_MESSAGE =
  "I am here with you. Tell me what happened today, and I will help you slow things down one step at a time.";

function moodText(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.role === "user")
    .slice(-4)
    .map((m) => m.content.trim())
    .filter(Boolean)
    .join("\n");
}

export default function ChatPage() {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<UserRecord | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: INITIAL_MESSAGE }]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [refreshingMood, setRefreshingMood] = useState(false);
  const [error, setError] = useState("");
  const [selectedMood, setSelectedMood] = useState<MoodSentiment | null>(null);
  const [detectedMood, setDetectedMood] = useState<MoodPrediction>({ mood: "neutral", confidence: 0.4 });
  const [lastResponse, setLastResponse] = useState<MoodCoachResponse | null>(null);

  const activeMoodKey = selectedMood ?? detectedMood.mood;
  const activeMood = VISUALS[activeMoodKey];
  const initials = useMemo(() => {
    const raw = user?.username ?? user?.name;
    if (raw) return raw.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
    return user?.email?.slice(0, 2).toUpperCase() ?? "U";
  }, [user]);

  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await axios.get<UserRecord>("/api/auth/me", { withCredentials: true });
        setUser(data);
      } catch {
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    };
    check();
  }, [router]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const refreshMood = async (sourceMessages: ChatMessage[]) => {
    const text = moodText(sourceMessages);
    if (!text) return null;
    setRefreshingMood(true);
    try {
      const { data } = await axios.post<MoodPrediction>("/api/mood/predict", { text }, { withCredentials: true });
      setDetectedMood(data);
      return data;
    } catch {
      return null;
    } finally {
      setRefreshingMood(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
    } catch {}
    router.push("/login");
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    const userMessage: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);
    setError("");
    try {
      const prediction = await refreshMood(nextMessages);
      const { data } = await axios.post<MoodCoachResponse>(
        "/api/mood/coach",
        {
          text,
          mood: selectedMood ?? prediction?.mood ?? detectedMood.mood,
          confidence: prediction?.confidence ?? detectedMood.confidence,
          history: nextMessages.slice(-10),
        },
        { withCredentials: true }
      );
      setLastResponse(data);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.followUpQuestion ? `${data.reply}\n\n${data.followUpQuestion}` : data.reply,
        },
      ]);
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data?.error === "string"
          ? err.response.data.error
          : "Unable to send your message right now.";
      setError(message);
      setMessages(messages);
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#09090f", display: "flex", alignItems: "center", justifyContent: "center", color: "#a78bfa" }}>
        <Loader2 size={26} style={{ animation: "spin 0.9s linear infinite" }} />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        body { margin: 0; background: #09090f; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .lora { font-family: 'Lora', serif; }
        .root { min-height: 100vh; color: white; font-family: 'DM Sans', sans-serif; background: linear-gradient(135deg, #09090f 0%, rgba(255,255,255,0.02) 48%, #09090f 100%); }
        .orb { position: fixed; border-radius: 999px; filter: blur(90px); pointer-events: none; z-index: 0; }
        .nav { position: sticky; top: 0; z-index: 10; backdrop-filter: blur(18px); background: rgba(9,9,15,0.72); border-bottom: 1px solid rgba(255,255,255,0.08); }
        .nav-inner { max-width: 1180px; margin: 0 auto; padding: 0 24px; height: 60px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .main { max-width: 1180px; margin: 0 auto; padding: 28px 24px 40px; display: grid; grid-template-columns: minmax(0,2fr) minmax(300px,1fr); gap: 22px; position: relative; z-index: 1; }
        .panel { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; backdrop-filter: blur(22px); box-shadow: 0 24px 60px rgba(0,0,0,0.35); }
        .hero { padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.07); }
        .feed { padding: 18px; display: flex; flex-direction: column; gap: 14px; min-height: 460px; max-height: 60vh; overflow-y: auto; }
        .row { display: flex; gap: 12px; align-items: flex-start; }
        .row.user { justify-content: flex-end; }
        .bubble { max-width: min(80%,620px); padding: 14px 16px; border-radius: 18px; font-size: 14px; line-height: 1.7; white-space: pre-wrap; }
        .bubble.assistant { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-top-left-radius: 8px; color: rgba(255,255,255,0.88); }
        .bubble.user { background: ${activeMood.color}; color: #0a0a14; border-top-right-radius: 8px; }
        .input-wrap { padding: 18px; border-top: 1px solid rgba(255,255,255,0.07); display: flex; flex-direction: column; gap: 12px; }
        .input-box { display: flex; gap: 12px; align-items: flex-end; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 12px; }
        .textarea { width: 100%; min-height: 52px; max-height: 160px; resize: vertical; border: none; outline: none; background: transparent; color: white; font: inherit; line-height: 1.6; }
        .side { padding: 18px; display: flex; flex-direction: column; gap: 16px; }
        .side-card { border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); padding: 18px; }
        .mood-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }
        .mood-btn, .inline-btn, .prompt-btn, .send-btn { cursor: pointer; font: inherit; }
        .mood-btn { text-align: left; border-radius: 14px; padding: 12px 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.72); }
        .inline-btn { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); border-radius: 12px; padding: 10px 14px; }
        .prompt-btn { width: 100%; text-align: left; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.72); border-radius: 14px; padding: 12px 13px; }
        .send-btn { width: 46px; height: 46px; border: none; border-radius: 14px; background: ${activeMood.color}; color: #0a0a14; display: inline-flex; align-items: center; justify-content: center; }
        .small { font-size: 12px; color: rgba(255,255,255,0.35); }
        .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; color: rgba(255,255,255,0.32); margin-bottom: 10px; }
        .error { border: 1px solid rgba(248,113,113,0.25); background: rgba(248,113,113,0.08); color: #fca5a5; border-radius: 14px; padding: 12px 14px; font-size: 13px; }
        @media (max-width: 980px) { .main { grid-template-columns: 1fr; } .feed { max-height: none; min-height: 380px; } }
      `}</style>

      <div className="root">
        <div className="orb" style={{ width: 520, height: 520, top: -180, left: -140, background: activeMood.color, opacity: 0.12 }} />
        <div className="orb" style={{ width: 360, height: 360, bottom: "4%", right: -120, background: activeMood.color, opacity: 0.08 }} />

        <nav className="nav">
          <div className="nav-inner">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button onClick={() => router.push("/dashboard")} style={{ border: "none", background: "transparent", color: "rgba(255,255,255,0.46)", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <ArrowLeft size={14} /> Dashboard
              </button>
              <Link href="/" className="brand">
                <div style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${activeMood.border}`, background: activeMood.bg, color: activeMood.color }}>◎</div>
                <span className="lora" style={{ fontSize: 20, fontWeight: 700, color: activeMood.color }}>EmoSoul</span>
              </Link>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px 6px 6px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.78)", cursor: "pointer" }}>
                  <Avatar style={{ width: 28, height: 28 }}>
                    <AvatarFallback style={{ background: activeMood.bg, color: activeMood.color, fontSize: 11, fontWeight: 700 }}>{initials}</AvatarFallback>
                  </Avatar>
                  <span>{user?.username ?? user?.name ?? user?.email ?? "Account"}</span>
                  <ChevronDown size={13} style={{ opacity: 0.55 }} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
                <DropdownMenuLabel style={{ color: "rgba(255,255,255,0.42)", fontSize: 11 }}>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator style={{ background: "rgba(255,255,255,0.08)" }} />
                <DropdownMenuItem onClick={() => router.push("/dashboard")} style={{ cursor: "pointer", color: "rgba(255,255,255,0.8)" }}>Dashboard</DropdownMenuItem>
                <DropdownMenuSeparator style={{ background: "rgba(255,255,255,0.08)" }} />
                <DropdownMenuItem onClick={logout} style={{ cursor: "pointer", color: "#f87171", display: "flex", gap: 8 }}><LogOut size={13} /> Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        <main className="main">
          <section className="panel">
            <div className="hero">
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 999, border: `1px solid ${activeMood.border}`, background: activeMood.bg, color: activeMood.color, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
                <Brain size={13} /> Mood-aware AI chat
              </div>
              <h1 className="lora" style={{ fontSize: "clamp(1.7rem,4vw,2.5rem)", margin: 0, marginBottom: 8 }}>
                Talk through what you are <span style={{ color: activeMood.color, fontStyle: "italic" }}>feeling</span>
              </h1>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.45)" }}>
                This page follows your current UI style and uses the existing mood coach API plus mood refresh from the conversation.
              </p>
            </div>

            <div className="feed">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`row ${message.role === "user" ? "user" : ""}`}>
                  {message.role === "assistant" && (
                    <Avatar style={{ width: 34, height: 34 }}>
                      <AvatarFallback style={{ background: activeMood.bg, border: `1px solid ${activeMood.border}`, color: activeMood.color }}><Bot size={16} /></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`bubble ${message.role}`}>{message.content}</div>
                  {message.role === "user" && (
                    <Avatar style={{ width: 34, height: 34 }}>
                      <AvatarFallback style={{ background: "rgba(255,255,255,0.08)", color: "white" }}><User size={16} /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {sending && (
                <div className="row">
                  <Avatar style={{ width: 34, height: 34 }}>
                    <AvatarFallback style={{ background: activeMood.bg, border: `1px solid ${activeMood.border}`, color: activeMood.color }}><Bot size={16} /></AvatarFallback>
                  </Avatar>
                  <div className="bubble assistant" style={{ display: "flex", gap: 8 }}><Loader2 size={16} style={{ animation: "spin 0.9s linear infinite" }} /> Thinking through your mood...</div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="input-wrap">
              {error ? <div className="error">{error}</div> : null}
              <div className="input-box">
                <textarea
                  className="textarea"
                  placeholder="Tell me what is going on right now..."
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                />
                <button className="send-btn" onClick={() => void sendMessage()} disabled={!draft.trim() || sending}>
                  {sending ? <Loader2 size={18} style={{ animation: "spin 0.9s linear infinite" }} /> : <Send size={18} />}
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div className="small">Mood source: {selectedMood ? "manual override" : "auto refresh from chat"}</div>
                <button className="inline-btn" onClick={() => void refreshMood(messages)} disabled={refreshingMood}>
                  {refreshingMood ? <Loader2 size={14} style={{ animation: "spin 0.9s linear infinite" }} /> : <RefreshCw size={14} />}
                  Refresh mood
                </button>
              </div>
            </div>
          </section>

          <aside className="panel">
            <div className="side">
              <Card className="side-card"><CardContent style={{ padding: 0 }}>
                <div className="label">Current mood</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                  <div>
                    <div className="lora" style={{ fontSize: "1.45rem", fontWeight: 700, marginBottom: 4 }}><span style={{ color: activeMood.color }}>{activeMood.label}</span> {activeMood.emoji}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.44)" }}>Confidence {Math.round(detectedMood.confidence * 100)}%</div>
                  </div>
                  <div style={{ width: 68, height: 68, borderRadius: 20, background: activeMood.bg, border: `1px solid ${activeMood.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{activeMood.emoji}</div>
                </div>
                <p style={{ margin: "14px 0 0", fontSize: 13, color: "rgba(255,255,255,0.52)", lineHeight: 1.7 }}>
                  {detectedMood.rationale ?? "The page keeps refreshing your mood from recent user messages so the assistant stays aligned."}
                </p>
              </CardContent></Card>

              <Card className="side-card"><CardContent style={{ padding: 0 }}>
                <div className="label">Manual mood</div>
                <div className="mood-grid">
                  {MOODS.map((mood) => (
                    <button
                      key={mood}
                      className="mood-btn"
                      onClick={() => setSelectedMood((current) => current === mood ? null : mood)}
                      style={selectedMood === mood ? { background: VISUALS[mood].bg, borderColor: VISUALS[mood].border, color: VISUALS[mood].color } : undefined}
                    >
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{VISUALS[mood].emoji}</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{VISUALS[mood].label}</div>
                    </button>
                  ))}
                </div>
              </CardContent></Card>

              <Card className="side-card"><CardContent style={{ padding: 0 }}>
                <div className="label">Quick start</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {STARTERS.map((prompt) => <button key={prompt} className="prompt-btn" onClick={() => setDraft(prompt)}>{prompt}</button>)}
                </div>
              </CardContent></Card>

              {lastResponse?.nextAction ? (
                <Card className="side-card"><CardContent style={{ padding: 0 }}>
                  <div className="label">Next action</div>
                  <div className="lora" style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 8 }}>{lastResponse.nextAction.title ?? "Support step"}</div>
                  {lastResponse.nextAction.journalPrompt ? <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.72)" }}>{lastResponse.nextAction.journalPrompt}</p> : null}
                  {lastResponse.nextAction.steps?.length ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
                      {lastResponse.nextAction.steps.map((step) => (
                        <div key={step} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.72)" }}>
                          <span style={{ width: 8, height: 8, marginTop: 6, borderRadius: 999, background: activeMood.color, flexShrink: 0 }} />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent></Card>
              ) : null}
            </div>
          </aside>
        </main>
      </div>
    </>
  );
}
