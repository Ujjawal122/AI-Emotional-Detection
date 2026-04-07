"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Loader2,
  LogOut,
  Pin,
  Save,
  Tag,
} from "lucide-react";

interface User {
  id?: string;
  _id?: string;
  username?: string;
  name?: string;
  email?: string;
}

interface NoteDetail {
  _id: string;
  title: string;
  content: string;
  folder?: string;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_FOLDER = "root";

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NoteDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const noteId = typeof params?.id === "string" ? params.id : "";

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState<NoteDetail | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [folder, setFolder] = useState(DEFAULT_FOLDER);
  const [tagsInput, setTagsInput] = useState("");
  const [isPinned, setIsPinned] = useState(false);

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

  useEffect(() => {
    if (!noteId) return;

    const fetchNote = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await axios.get<NoteDetail>(`/api/notes/${noteId}`, { withCredentials: true });
        setNote(data);
        setTitle(data.title ?? "");
        setContent(data.content ?? "");
        setFolder(data.folder ?? DEFAULT_FOLDER);
        setTagsInput((data.tags ?? []).join(", "));
        setIsPinned(Boolean(data.isPinned));
      } catch (err) {
        const message =
          err instanceof AxiosError
            ? err.response?.data?.error ?? "Failed to load note."
            : "Failed to load note.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [noteId]);

  useEffect(() => {
    if (!savedFlash) return;
    const timer = setTimeout(() => setSavedFlash(false), 2400);
    return () => clearTimeout(timer);
  }, [savedFlash]);

  const displayName = user?.username ?? user?.name;
  const initials = displayName
    ? displayName.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const tags = useMemo(() => parseTags(tagsInput), [tagsInput]);

  const isDirty = Boolean(
    note &&
    (
      title !== note.title ||
      content !== note.content ||
      (folder || DEFAULT_FOLDER) !== (note.folder || DEFAULT_FOLDER) ||
      tagsInput !== (note.tags ?? []).join(", ") ||
      isPinned !== note.isPinned
    )
  );

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
    } catch {
      // silent
    }
    router.push("/login");
  };

  const handleSave = async () => {
    if (!noteId) return;
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        folder: folder.trim() || DEFAULT_FOLDER,
        tags,
        isPinned,
      };

      const { data } = await axios.patch<NoteDetail>(`/api/notes/${noteId}`, payload, {
        withCredentials: true,
      });

      setNote(data);
      setTitle(data.title ?? "");
      setContent(data.content ?? "");
      setFolder(data.folder ?? DEFAULT_FOLDER);
      setTagsInput((data.tags ?? []).join(", "));
      setIsPinned(Boolean(data.isPinned));
      setSavedFlash(true);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? err.response?.data?.error ?? "Failed to update note."
          : "Failed to update note.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
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

  if (!note && error) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
          body { margin: 0; background: #09090f; }
        `}</style>
        <div style={{ minHeight: "100vh", background: "#09090f", color: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Card style={{ width: "100%", maxWidth: 520, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "white" }}>
            <CardHeader>
              <CardTitle style={{ fontFamily: "'Lora', serif" }}>Could not open this note</CardTitle>
              <CardDescription style={{ color: "rgba(255,255,255,0.5)" }}>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => router.push("/dashboard")}
                style={{ height: 44, borderRadius: 12, border: "none", background: "#a78bfa", color: "#09090f", padding: "0 16px", fontWeight: 600, cursor: "pointer" }}
              >
                Back to Dashboard
              </button>
            </CardContent>
          </Card>
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

        .nd-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          color: white;
          position: relative;
          overflow-x: hidden;
          background: linear-gradient(135deg, #09090f 0%, rgba(167,139,250,0.08) 42%, rgba(52,211,153,0.05) 100%);
        }
        .lora { font-family: 'Lora', serif; }
        .nd-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image: radial-gradient(circle, rgba(167,139,250,0.055) 1px, transparent 1px);
          background-size: 36px 36px;
          pointer-events: none;
        }
        .nd-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          z-index: 0;
        }
        .nd-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(9,9,15,0.72);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .nd-nav-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nd-back {
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
        .nd-back:hover { color: #a78bfa; }
        .nd-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .nd-logo-ring {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(167,139,250,0.12);
          border: 1.5px solid rgba(167,139,250,0.4);
          font-size: 14px;
          animation: ndSpin 14s linear infinite;
        }
        @keyframes ndSpin { to { transform: rotate(360deg); } }
        .nd-logo-text {
          font-family: 'Lora', serif;
          font-size: 19px;
          font-weight: 700;
          color: #a78bfa;
        }
        .nd-user-btn {
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
        .nd-user-btn:hover { background: rgba(255,255,255,0.09); }
        .nd-dropdown {
          background: #111120 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: white !important;
          min-width: 180px;
        }
        .nd-main {
          position: relative;
          z-index: 10;
          max-width: 960px;
          margin: 0 auto;
          padding: 36px 24px 80px;
          animation: ndFadeUp 0.6s ease both;
        }
        @keyframes ndFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nd-card {
          background: rgba(255,255,255,0.035) !important;
          border: 1px solid rgba(255,255,255,0.09) !important;
          border-radius: 22px !important;
          backdrop-filter: blur(20px) !important;
          box-shadow: 0 24px 60px rgba(0,0,0,0.4) !important;
          overflow: hidden;
          position: relative;
        }
        .nd-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(167,139,250,0.5), transparent);
          pointer-events: none;
        }
        .nd-card-header {
          padding: 28px 28px 18px !important;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .nd-card-title {
          font-family: 'Lora', serif !important;
          font-size: 1.55rem !important;
          font-weight: 700 !important;
          color: white !important;
        }
        .nd-card-desc {
          color: rgba(255,255,255,0.4) !important;
          font-size: 14px !important;
          margin-top: 5px !important;
          line-height: 1.7;
        }
        .nd-card-content { padding: 24px 28px 28px !important; }
        .nd-section-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: rgba(255,255,255,0.35);
          margin-bottom: 10px;
        }
        .nd-input, .nd-textarea {
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
        .nd-input {
          height: 48px;
          padding: 0 16px;
        }
        .nd-textarea {
          min-height: 320px;
          padding: 16px 18px;
          resize: vertical;
          line-height: 1.75;
        }
        .nd-input::placeholder, .nd-textarea::placeholder {
          color: rgba(255,255,255,0.22);
        }
        .nd-input:focus, .nd-textarea:focus {
          border-color: rgba(167,139,250,0.5);
          background: rgba(167,139,250,0.06);
          box-shadow: 0 0 0 3px rgba(167,139,250,0.1);
        }
        .nd-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        @media (max-width: 760px) {
          .nd-grid-2 { grid-template-columns: 1fr; }
        }
        .nd-meta-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.65);
          font-size: 12px;
        }
        .nd-preview-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .nd-tag {
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
        .nd-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .nd-pin-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 44px;
          padding: 0 16px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.82);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .nd-pin-btn.active {
          background: rgba(249,168,212,0.12);
          border-color: rgba(249,168,212,0.26);
          color: #f9a8d4;
        }
        .nd-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .nd-primary-btn, .nd-secondary-btn {
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
        .nd-primary-btn {
          border: none;
          background: linear-gradient(135deg, #a78bfa, #34d399);
          color: #0a0a14;
          min-width: 220px;
        }
        .nd-secondary-btn {
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.78);
        }
        .nd-primary-btn:hover:not(:disabled), .nd-secondary-btn:hover:not(:disabled), .nd-pin-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.35);
        }
        .nd-primary-btn:disabled, .nd-secondary-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .nd-error {
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
        .nd-strip {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 14px 28px;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(167,139,250,0.05);
        }
        .nd-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #a78bfa;
          animation: ndPulse 2.4s ease-in-out infinite;
        }
        .nd-dot:nth-child(2) { opacity: 0.6; animation-delay: 0.4s; }
        .nd-dot:nth-child(3) { opacity: 0.3; animation-delay: 0.8s; }
        @keyframes ndPulse { 0%,100% { opacity: .3; } 50% { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .nd-spinner { animation: spin 0.8s linear infinite; }
      `}</style>

      <div className="nd-root">
        <div className="nd-grid" />
        <div className="nd-orb" style={{ width: 480, height: 480, top: -180, left: -110, background: "rgba(167,139,250,0.32)", opacity: 0.14 }} />
        <div className="nd-orb" style={{ width: 340, height: 340, bottom: "8%", right: -80, background: "rgba(52,211,153,0.22)", opacity: 0.12 }} />

        <nav className="nd-nav">
          <div className="nd-nav-inner">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button className="nd-back" onClick={() => router.push("/dashboard")}>
                <ArrowLeft size={14} /> Dashboard
              </button>
              <Link href="/" className="nd-logo">
                <div className="nd-logo-ring">🌀</div>
                <span className="nd-logo-text">EmoSoul</span>
              </Link>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="nd-user-btn">
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
              <DropdownMenuContent align="end" className="nd-dropdown">
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

        <main className="nd-main">
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: "#c4b5fd", marginBottom: 6 }}>
            Notes
          </p>
          <h1 className="lora" style={{ fontSize: "clamp(1.7rem, 4vw, 2.35rem)", fontWeight: 700, marginBottom: 6 }}>
            Review and refine{" "}
            <span style={{ color: "#86efac", fontStyle: "italic" }}>what you wrote.</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14, marginBottom: 28 }}>
            Read your note clearly, then edit it when the meaning needs sharpening.
          </p>

          <Card className="nd-card">
            <CardHeader className="nd-card-header">
              <CardTitle className="nd-card-title">{title.trim() || "Untitled note"}</CardTitle>
              <CardDescription className="nd-card-desc">
                Your note stays editable here. Save changes only when you are satisfied with the revision.
              </CardDescription>
            </CardHeader>

            <CardContent className="nd-card-content">
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <div className="nd-grid-2">
                  <div className="nd-meta-card">
                    <CalendarDays size={14} style={{ color: "#c4b5fd" }} />
                    <span>Created {note?.createdAt ? formatDate(note.createdAt) : "-"}</span>
                  </div>
                  <div className="nd-meta-card">
                    <CheckCircle2 size={14} style={{ color: "#86efac" }} />
                    <span>Last updated {note?.updatedAt ? formatDate(note.updatedAt) : "-"}</span>
                  </div>
                </div>

                <div>
                  <p className="nd-section-label">Title</p>
                  <input
                    className="nd-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="A clear title"
                    maxLength={120}
                  />
                </div>

                <div>
                  <p className="nd-section-label">Content</p>
                  <textarea
                    className="nd-textarea"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Your note content"
                    maxLength={5000}
                  />
                </div>

                <div className="nd-grid-2">
                  <div>
                    <p className="nd-section-label">Folder</p>
                    <input
                      className="nd-input"
                      value={folder}
                      onChange={(e) => setFolder(e.target.value)}
                      placeholder="root"
                      maxLength={60}
                    />
                  </div>
                  <div>
                    <p className="nd-section-label">Tags</p>
                    <input
                      className="nd-input"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="ideas, work, reflection"
                      maxLength={200}
                    />
                  </div>
                </div>

                {tags.length > 0 && (
                  <div>
                    <p className="nd-section-label">Tag preview</p>
                    <div className="nd-preview-tags">
                      {tags.map((tag) => (
                        <span key={tag} className="nd-tag">
                          <Tag size={12} /> {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="nd-row">
                  <button
                    type="button"
                    className={`nd-pin-btn ${isPinned ? "active" : ""}`}
                    onClick={() => setIsPinned((current) => !current)}
                  >
                    <Pin size={14} /> {isPinned ? "Pinned in dashboard" : "Pin this note"}
                  </button>

                  <div style={{ fontSize: 12, color: savedFlash ? "#86efac" : "rgba(255,255,255,0.3)" }}>
                    {savedFlash
                      ? "Changes saved."
                      : isDirty
                      ? "You have unsaved edits."
                      : "No unsaved changes."}
                  </div>
                </div>

                {error && (
                  <div className="nd-error">
                    <span style={{ marginTop: 1 }}>⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                <div className="nd-actions">
                  <button className="nd-primary-btn" disabled={saving || !isDirty || !title.trim() || !content.trim()} onClick={handleSave}>
                    {saving ? (
                      <>
                        <Loader2 size={16} className="nd-spinner" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save changes
                      </>
                    )}
                  </button>
                  <button className="nd-secondary-btn" disabled={saving} onClick={() => router.push("/dashboard")}>
                    <ArrowLeft size={15} /> Back to Dashboard
                  </button>
                </div>
              </div>
            </CardContent>

            <div className="nd-strip">
              <div className="nd-dot" />
              <div className="nd-dot" />
              <div className="nd-dot" />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", letterSpacing: "0.02em", marginLeft: 4 }}>
                {saving
                  ? "Saving note updates..."
                  : isDirty
                  ? "Edit mode active"
                  : "Viewing saved note"}
              </span>
            </div>
          </Card>
        </main>
      </div>
    </>
  );
}
