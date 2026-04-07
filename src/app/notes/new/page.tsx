"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowLeft,
  ChevronDown,
  FileText,
  Loader2,
  LogOut,
  Pin,
  RotateCcw,
  Sparkles,
  Tag,
} from "lucide-react";

interface User {
  id?: string;
  _id?: string;
  username?: string;
  name?: string;
  email?: string;
}

interface NotePayload {
  title: string;
  content: string;
  folder: string;
  tags: string[];
  isPinned: boolean;
}

const DEFAULT_FOLDER = "root";

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function NewNotePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [folder, setFolder] = useState(DEFAULT_FOLDER);
  const [tagsInput, setTagsInput] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

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

  const displayName = user?.username ?? user?.name;
  const initials = displayName
    ? displayName.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const tags = useMemo(() => parseTags(tagsInput), [tagsInput]);
  const titleCount = title.trim().length;
  const contentCount = content.trim().length;
  const canSave = titleCount > 0 && contentCount > 0 && !saving;

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
    } catch {
      // silent
    }
    router.push("/login");
  };

  const handleReset = () => {
    setTitle("");
    setContent("");
    setFolder(DEFAULT_FOLDER);
    setTagsInput("");
    setIsPinned(false);
    setSaved(false);
    setError("");
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    const payload: NotePayload = {
      title: title.trim(),
      content: content.trim(),
      folder: folder.trim() || DEFAULT_FOLDER,
      tags,
      isPinned,
    };

    setSaving(true);
    setError("");

    try {
      await axios.post("/api/notes", payload, { withCredentials: true });
      setSaved(true);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? err.response?.data?.error ?? "Failed to save note. Please try again."
          : "Failed to save note. Please try again.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

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

        .np-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          color: white;
          position: relative;
          overflow-x: hidden;
          background: linear-gradient(135deg, #09090f 0%, rgba(167,139,250,0.08) 46%, rgba(244,114,182,0.05) 100%);
        }
        .lora { font-family: 'Lora', serif; }

        .np-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          z-index: 0;
        }
        .np-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image: radial-gradient(circle, rgba(167,139,250,0.055) 1px, transparent 1px);
          background-size: 36px 36px;
          pointer-events: none;
        }

        .np-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(9,9,15,0.72);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .np-nav-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .np-back {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: rgba(255,255,255,0.4);
          text-decoration: none;
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.2s;
        }
        .np-back:hover { color: #a78bfa; }
        .np-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .np-logo-ring {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(167,139,250,0.12);
          border: 1.5px solid rgba(167,139,250,0.4);
          font-size: 14px;
          animation: npSpin 14s linear infinite;
        }
        @keyframes npSpin { to { transform: rotate(360deg); } }
        .np-logo-text {
          font-family: 'Lora', serif;
          font-size: 19px;
          font-weight: 700;
          color: #a78bfa;
        }
        .np-user-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px 6px 6px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.2s;
          color: rgba(255,255,255,0.8);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
        }
        .np-user-btn:hover { background: rgba(255,255,255,0.09); }
        .np-dropdown {
          background: #111120 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: white !important;
          min-width: 180px;
        }

        .np-main {
          position: relative;
          z-index: 10;
          max-width: 860px;
          margin: 0 auto;
          padding: 36px 24px 80px;
          animation: npFadeUp 0.6s ease both;
        }
        @keyframes npFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .np-card {
          background: rgba(255,255,255,0.035) !important;
          border: 1px solid rgba(255,255,255,0.09) !important;
          border-radius: 22px !important;
          backdrop-filter: blur(20px) !important;
          box-shadow: 0 24px 60px rgba(0,0,0,0.4) !important;
          overflow: hidden;
          position: relative;
        }
        .np-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(167,139,250,0.5), transparent);
          pointer-events: none;
        }
        .np-card-header {
          padding: 28px 28px 18px !important;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .np-card-title {
          font-family: 'Lora', serif !important;
          font-size: 1.55rem !important;
          font-weight: 700 !important;
          color: white !important;
        }
        .np-card-desc {
          color: rgba(255,255,255,0.4) !important;
          font-size: 14px !important;
          margin-top: 5px !important;
          line-height: 1.7;
        }
        .np-card-content { padding: 24px 28px 28px !important; }

        .np-section-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: rgba(255,255,255,0.35);
          margin-bottom: 10px;
        }
        .np-input, .np-textarea {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          outline: none;
          transition: border-color 0.3s, background 0.3s, box-shadow 0.3s;
        }
        .np-input {
          height: 48px;
          padding: 0 16px;
        }
        .np-textarea {
          min-height: 280px;
          padding: 16px 18px;
          resize: vertical;
          line-height: 1.75;
        }
        .np-input::placeholder, .np-textarea::placeholder {
          color: rgba(255,255,255,0.22);
        }
        .np-input:focus, .np-textarea:focus {
          border-color: rgba(167,139,250,0.5);
          background: rgba(167,139,250,0.06);
          box-shadow: 0 0 0 3px rgba(167,139,250,0.1);
        }

        .np-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        @media (max-width: 700px) {
          .np-meta-grid { grid-template-columns: 1fr; }
        }

        .np-option-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .np-toggle {
          width: 52px;
          height: 30px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          position: relative;
          transition: background 0.25s ease;
        }
        .np-toggle::after {
          content: '';
          position: absolute;
          top: 4px;
          left: 4px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #09090f;
          transition: transform 0.25s ease;
        }
        .np-toggle.active::after { transform: translateX(22px); }

        .np-badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .np-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(167,139,250,0.12);
          border: 1px solid rgba(167,139,250,0.28);
          color: #d8c7ff;
          font-size: 12px;
        }

        .np-helper {
          font-size: 12px;
          color: rgba(255,255,255,0.25);
          margin-top: 7px;
        }
        .np-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.25);
          border-radius: 10px;
          padding: 10px 14px;
          color: #fca5a5;
          font-size: 13px;
          line-height: 1.5;
        }
        .np-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .np-primary-btn, .np-secondary-btn {
          border-radius: 14px;
          height: 48px;
          padding: 0 18px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
        }
        .np-primary-btn {
          border: none;
          background: linear-gradient(135deg, #a78bfa, #f472b6);
          color: #0a0a14;
          min-width: 220px;
        }
        .np-secondary-btn {
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.78);
        }
        .np-primary-btn:hover:not(:disabled), .np-secondary-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.35);
        }
        .np-primary-btn:disabled, .np-secondary-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .np-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 20px 0 8px;
          text-align: center;
          animation: npFadeUp 0.5s ease both;
        }
        .np-success-ring {
          width: 74px;
          height: 74px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(167,139,250,0.14);
          border: 2px solid rgba(167,139,250,0.32);
          font-size: 30px;
        }

        .np-strip {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 14px 28px;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(167,139,250,0.05);
        }
        .np-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #a78bfa;
          animation: npPulse 2.4s ease-in-out infinite;
        }
        .np-dot:nth-child(2) { opacity: 0.6; animation-delay: 0.4s; }
        .np-dot:nth-child(3) { opacity: 0.3; animation-delay: 0.8s; }
        @keyframes npPulse { 0%,100% { opacity: .3; } 50% { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .np-spinner { animation: spin 0.8s linear infinite; }
      `}</style>

      <div className="np-root">
        <div className="np-grid" />
        <div className="np-orb" style={{ width: 480, height: 480, top: -180, left: -110, background: "rgba(167,139,250,0.32)", opacity: 0.14 }} />
        <div className="np-orb" style={{ width: 340, height: 340, bottom: "6%", right: -80, background: "rgba(244,114,182,0.24)", opacity: 0.12 }} />

        <nav className="np-nav">
          <div className="np-nav-inner">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button className="np-back" onClick={() => router.push("/dashboard")}>
                <ArrowLeft size={14} /> Dashboard
              </button>
              <Link href="/" className="np-logo">
                <div className="np-logo-ring">🌀</div>
                <span className="np-logo-text">EmoSoul</span>
              </Link>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="np-user-btn">
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
              <DropdownMenuContent align="end" className="np-dropdown">
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

        <main className="np-main">
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: "#c4b5fd", marginBottom: 6 }}>
            Notes
          </p>
          <h1 className="lora" style={{ fontSize: "clamp(1.7rem, 4vw, 2.35rem)", fontWeight: 700, marginBottom: 6 }}>
            Write a note that{" "}
            <span style={{ color: "#f9a8d4", fontStyle: "italic" }}>stays with you.</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14, marginBottom: 28 }}>
            Capture thoughts, reminders, and fragments before they drift away.
          </p>

          <Card className="np-card">
            <CardHeader className="np-card-header">
              <CardTitle className="np-card-title">
                {saved ? "Note saved!" : "Create a new note"}
              </CardTitle>
              <CardDescription className="np-card-desc">
                {saved
                  ? "Your note has been added to your workspace."
                  : "Keep it sharp and readable now, so it still makes sense later."}
              </CardDescription>
            </CardHeader>

            <CardContent className="np-card-content">
              {saved ? (
                <div className="np-success">
                  <div className="np-success-ring">
                    <FileText size={28} />
                  </div>
                  <div>
                    <p className="lora" style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 6 }}>
                      {title.trim() || "Untitled note"}
                    </p>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 460, margin: "0 auto" }}>
                      Saved in <span style={{ color: "#c4b5fd" }}>{folder.trim() || DEFAULT_FOLDER}</span>
                      {tags.length > 0 ? ` with ${tags.length} tag${tags.length > 1 ? "s" : ""}.` : "."}
                    </p>
                  </div>
                  <div className="np-actions" style={{ justifyContent: "center", marginTop: 4 }}>
                    <button className="np-primary-btn" onClick={handleReset}>
                      <RotateCcw size={15} /> Write another note
                    </button>
                    <button className="np-secondary-btn" onClick={() => router.push("/dashboard")}>
                      <ArrowLeft size={15} /> Back to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                  <div>
                    <p className="np-section-label">Title</p>
                    <input
                      className="np-input"
                      placeholder="A quick title for this note"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={120}
                    />
                    <p className="np-helper">{title.length}/120 characters</p>
                  </div>

                  <div>
                    <p className="np-section-label">Content</p>
                    <textarea
                      className="np-textarea"
                      placeholder="Write freely. Capture the detail you will want later."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      maxLength={5000}
                    />
                    <p className="np-helper">{content.length}/5000 characters</p>
                  </div>

                  <div className="np-meta-grid">
                    <div>
                      <p className="np-section-label">Folder</p>
                      <input
                        className="np-input"
                        placeholder="root"
                        value={folder}
                        onChange={(e) => setFolder(e.target.value)}
                        maxLength={60}
                      />
                      <p className="np-helper">Leave as `root` unless you already organize notes into folders.</p>
                    </div>

                    <div>
                      <p className="np-section-label">Tags</p>
                      <input
                        className="np-input"
                        placeholder="ideas, work, follow-up"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        maxLength={200}
                      />
                      <p className="np-helper">Use commas to separate tags.</p>
                    </div>
                  </div>

                  {tags.length > 0 && (
                    <div>
                      <p className="np-section-label">Preview tags</p>
                      <div className="np-badge-row">
                        {tags.map((tag) => (
                          <span key={tag} className="np-tag">
                            <Tag size={12} /> {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="np-option-card">
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "white", display: "flex", alignItems: "center", gap: 8 }}>
                        <Pin size={14} style={{ color: "#f9a8d4" }} /> Pin this note
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                        Pinned notes stay visible first in your dashboard.
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`np-toggle ${isPinned ? "active" : ""}`}
                      style={{ background: isPinned ? "linear-gradient(135deg, #a78bfa, #f472b6)" : "rgba(255,255,255,0.12)" }}
                      onClick={() => setIsPinned((current) => !current)}
                      aria-pressed={isPinned}
                      aria-label="Toggle pinned note"
                    />
                  </div>

                  {error && (
                    <div className="np-error">
                      <span style={{ marginTop: 1 }}>⚠</span>
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="np-actions">
                    <button className="np-primary-btn" disabled={!canSave} onClick={handleSave}>
                      {saving ? (
                        <>
                          <Loader2 size={16} className="np-spinner" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Save note
                        </>
                      )}
                    </button>
                    <button className="np-secondary-btn" disabled={saving} onClick={handleReset}>
                      <RotateCcw size={15} /> Reset
                    </button>
                  </div>
                </div>
              )}
            </CardContent>

            <div className="np-strip">
              <div className="np-dot" />
              <div className="np-dot" />
              <div className="np-dot" />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", letterSpacing: "0.02em", marginLeft: 4 }}>
                {saving
                  ? "Saving your note..."
                  : saved
                  ? "Note recorded in your workspace"
                  : canSave
                  ? "Ready to save"
                  : "Add a title and content to continue"}
              </span>
            </div>
          </Card>
        </main>
      </div>
    </>
  );
}
