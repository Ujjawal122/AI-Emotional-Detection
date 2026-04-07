"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getCloudinaryUrl } from "@/lib/cloudinaryUrl";
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
  FolderOpen,
  FileText,
  TrendingUp,
  MessageCircle,
  LogOut,
  Loader2,
  Pin,
  ChevronDown,
  ChevronRight,
  Trash2,
  Sparkles,
  Plus,
  X,
  Download,
  Eye,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────
interface User {
  _id?: string;
  username?: string; // your MongoDB signup field
  id: string;
  name?: string;
  email?: string;
}
interface MoodEntry {
  _id: string;
  text: string;
  sentiment: string;
  intensity: number;
  createdAt: string;
}
interface Note {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
}
interface FileItem {
  _id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  folder: string;
  createdAt: string;
  url?: string;
  fileType?: string;
}

// ─── Mood palette (matches landing page accent system) ───
const MOOD_COLORS: Record<string, { bg: string; border: string; text: string; emoji: string }> = {
  happy:   { bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.28)",  text: "#34d399", emoji: "😊" },
  excited: { bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.28)",  text: "#fbbf24", emoji: "🤩" },
  neutral: { bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.28)", text: "#a78bfa", emoji: "😐" },
  sad:     { bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.28)",  text: "#60a5fa", emoji: "😢" },
  low:     { bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.28)", text: "#94a3b8", emoji: "😔" },
  stressed:{ bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.28)", text: "#f87171", emoji: "😤" },
  anxious: { bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.28)",  text: "#fb923c", emoji: "😰" },
  angry:   { bg: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.28)",   text: "#ef4444", emoji: "😠" },
};



const formatSize = (b: number) => {
  if (b === 0) return "0 B";
  const k = 1024, s = ["B", "KB", "MB", "GB"], i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + " " + s[i];
};
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

type TabType = "mood" | "notes" | "files" | "chat";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser]           = useState<User | null>(null);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("mood");

  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [notes, setNotes]             = useState<Note[]>([]);
  const [files, setFiles]             = useState<FileItem[]>([]);

  const [moodLoading, setMoodLoading]   = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // ── Auth via /api/auth/me ─────────────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get<User>("/api/auth/me", { withCredentials: true });
        setUser(data);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  // ── Fetch data on tab change ──────────────────────────
  useEffect(() => {
    if (!user) return;
    if (activeTab === "mood")  fetchMoodEntries();
    if (activeTab === "notes") fetchNotes();
    if (activeTab === "files") fetchFiles();
  }, [activeTab, user]);

  const fetchMoodEntries = async () => {
    setMoodLoading(true);
    try {
      const { data } = await axios.get("/api/mood/history", { withCredentials: true });
      setMoodEntries(data.moods ?? []);
    } catch { /* silent */ } finally { setMoodLoading(false); }
  };

  const fetchNotes = async () => {
    setNotesLoading(true);
    try {
      const { data } = await axios.get("/api/notes", { withCredentials: true });
      setNotes(data.notes ?? []);
    } catch { /* silent */ } finally { setNotesLoading(false); }
  };

  const fetchFiles = async () => {
    setFilesLoading(true);
    try {
      const { data } = await axios.get("/api/files", { withCredentials: true });
      // Enhance file data with Cloudinary URL
      const enhancedFiles = (data.files ?? []).map((file: FileItem) => ({
        ...file,
        url: file.url || getCloudinaryUrl(file),
        fileType: file.fileType || getFileType(file.originalName)
      }));
      setFiles(enhancedFiles);
    } catch { /* silent */ } finally { setFilesLoading(false); }
  };

  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
    if (['txt', 'md'].includes(ext)) return 'text';
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['xls', 'xlsx'].includes(ext)) return 'excel';
    if (['ppt', 'pptx'].includes(ext)) return 'powerpoint';
    return 'other';
  };

  const handleLogout = async () => {
    try { await axios.post("/api/auth/logout", {}, { withCredentials: true }); } catch { /* silent */ }
    router.push("/login");
  };

  const handleDeleteMood = async (id: string) => {
    setDeletingId(id);
    try {
      await axios.delete(`/api/mood/${id}`, { withCredentials: true });
      setMoodEntries((p) => p.filter((e) => e._id !== id));
    } catch { /* silent */ } finally { setDeletingId(null); }
  };

  const handleDeleteNote = async (id: string) => {
    setDeletingId(id);
    try {
      await axios.delete(`/api/notes/${id}`, { withCredentials: true });
      setNotes((p) => p.filter((n) => n._id !== id));
    } catch { /* silent */ } finally { setDeletingId(null); }
  };

  const handleDeleteFile = async (id: string) => {
    setDeletingId(id);
    try {
      await axios.delete(`/api/files/${id}`, { withCredentials: true });
      setFiles((p) => p.filter((f) => f._id !== id));
      if (selectedFile?._id === id) {
        setIsViewerOpen(false);
        setSelectedFile(null);
      }
    } catch { /* silent */ } finally { setDeletingId(null); }
  };

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    try {
      await axios.patch(`/api/notes/${id}`, { isPinned: !isPinned }, { withCredentials: true });
      setNotes((p) => p.map((n) => n._id === id ? { ...n, isPinned: !isPinned } : n));
    } catch { /* silent */ } 
  };

  const toggleFolder = (folder: string) =>
    setExpandedFolders((p) => ({ ...p, [folder]: !p[folder] }));

  const handleViewFile = (file: FileItem) => {
    setSelectedFile(file);
    setIsViewerOpen(true);
  };

  const handleDownloadFile = async (file: FileItem) => {
    try {
      if (file.url) {
        window.open(file.url, '_blank');
      } else {
        const response = await axios.get(`/api/files/${file._id}/download`, {
          responseType: 'blob',
          withCredentials: true
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file.originalName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const filesByFolder = files.reduce<Record<string, FileItem[]>>((acc, f) => {
    const key = f.folder || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  const sortedNotes = [...notes].sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));

  // username is the field from your signup route — fallback to name then email
  const displayName = user?.username ?? user?.name;
  const initials = displayName
    ? displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "mood",  label: "Mood",  icon: <TrendingUp  size={15} /> },
    { id: "notes", label: "Notes", icon: <FileText    size={15} /> },
    { id: "files", label: "Files", icon: <FolderOpen  size={15} /> },
    { id: "chat",  label: "Chat",  icon: <MessageCircle size={15} /> },
  ];

  // ── Full-page loader ──────────────────────────────────
  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
          body { margin: 0; background: #09090f; }
        `}</style>
        <div style={{ minHeight: "100vh", background: "#09090f", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(167,139,250,0.12)", border: "1.5px solid rgba(167,139,250,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, animation: "spin 14s linear infinite" }}>🌀</div>
            <Loader2 size={20} style={{ color: "#a78bfa", animation: "spin 1s linear infinite" }} />
          </div>
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

        .db-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: linear-gradient(135deg, #09090f 0%, #0d0d1c 50%, #09090f 100%);
          color: white;
          position: relative;
          overflow-x: hidden;
        }

        .lora { font-family: 'Lora', serif; }

        /* Orbs */
        .db-orb {
          position: fixed; border-radius: 50%; filter: blur(90px);
          opacity: 0.13; pointer-events: none; z-index: 0;
        }

        /* Grid dots */
        .db-grid {
          position: fixed; inset: 0; z-index: 0;
          background-image: radial-gradient(circle, rgba(167,139,250,0.055) 1px, transparent 1px);
          background-size: 36px 36px; pointer-events: none;
        }

        /* Navbar */
        .db-nav {
          position: sticky; top: 0; z-index: 50;
          background: rgba(9,9,15,0.72);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .db-nav-inner {
          max-width: 1100px; margin: 0 auto;
          padding: 0 24px; height: 58px;
          display: flex; align-items: center; justify-content: space-between;
        }

        /* Logo */
        .db-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .db-logo-ring {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(167,139,250,0.12);
          border: 1.5px solid rgba(167,139,250,0.4);
          font-size: 14px;
          animation: dbSpin 14s linear infinite;
        }
        @keyframes dbSpin { to { transform: rotate(360deg); } }
        .db-logo-text { font-family: 'Lora', serif; font-size: 19px; font-weight: 700; color: #a78bfa; }

        /* User dropdown btn */
        .db-user-btn {
          display: flex; align-items: center; gap: 8px;
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
        .db-user-btn:hover { background: rgba(255,255,255,0.09); }

        /* Main content */
        .db-main { position: relative; z-index: 10; max-width: 1100px; margin: 0 auto; padding: 32px 24px 60px; }

        /* Welcome strip */
        .db-welcome {
          margin-bottom: 32px;
          animation: dbFadeUp 0.6s ease both;
        }
        @keyframes dbFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Tab bar */
        .db-tabs {
          display: flex; gap: 4px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 5px;
          width: fit-content;
          margin-bottom: 28px;
        }
        .db-tab {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 18px;
          border-radius: 10px;
          font-size: 13px; font-weight: 500;
          cursor: pointer; border: none;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
          color: rgba(255,255,255,0.4);
          background: transparent;
        }
        .db-tab:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.04); }
        .db-tab.active {
          background: rgba(167,139,250,0.15);
          border: 1px solid rgba(167,139,250,0.25);
          color: #a78bfa;
        }

        /* Section header */
        .db-section-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px;
        }
        .db-section-title { font-family: 'Lora', serif; font-size: 1.5rem; font-weight: 700; }

        /* Add button */
        .db-add-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 18px;
          background: #a78bfa;
          color: #0a0a14;
          border: none; border-radius: 12px;
          font-size: 13px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .db-add-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(167,139,250,0.35); }

        /* Mood entry card */
        .db-mood-card {
          display: flex; align-items: flex-start; gap: 16px;
          padding: 16px 18px;
          border-radius: 16px;
          border: 1px solid;
          margin-bottom: 10px;
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
        }
        .db-mood-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
        .db-mood-emoji {
          width: 42px; height: 42px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .db-mood-delete {
          position: absolute; top: 12px; right: 12px;
          opacity: 0; transition: opacity 0.2s;
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.2);
          border-radius: 8px; padding: 5px;
          cursor: pointer; color: #f87171;
          display: flex; align-items: center;
        }
        .db-mood-card:hover .db-mood-delete { opacity: 1; }

        /* Note card override */
        .db-note-card {
          background: rgba(255,255,255,0.04) !important;
          border: 1px solid rgba(255,255,255,0.09) !important;
          border-radius: 16px !important;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.2s !important;
          position: relative;
          overflow: hidden;
        }
        .db-note-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(167,139,250,0.3), transparent);
        }
        .db-note-card:hover {
          background: rgba(255,255,255,0.07) !important;
          border-color: rgba(167,139,250,0.25) !important;
          transform: translateY(-3px);
        }

        /* Note hover actions */
        .db-note-actions {
          position: absolute; top: 10px; right: 10px;
          display: flex; gap: 4px;
          opacity: 0; transition: opacity 0.2s;
        }
        .db-note-card:hover .db-note-actions { opacity: 1; }
        .db-icon-btn {
          padding: 5px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.5);
          cursor: pointer; display: flex; align-items: center;
          transition: background 0.2s, color 0.2s;
        }
        .db-icon-btn:hover { background: rgba(248,113,113,0.15); color: #f87171; border-color: rgba(248,113,113,0.3); }
        .db-icon-btn.pin:hover { background: rgba(167,139,250,0.15); color: #a78bfa; border-color: rgba(167,139,250,0.3); }

        /* File folder */
        .db-folder {
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 16px; overflow: hidden;
          margin-bottom: 10px;
        }
        .db-folder-header {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.04);
          cursor: pointer; border: none; width: 100%; text-align: left;
          color: white; font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500;
          transition: background 0.2s;
        }
        .db-folder-header:hover { background: rgba(255,255,255,0.07); }
        .db-file-row {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          transition: background 0.2s;
          position: relative;
        }
        .db-file-row:hover { background: rgba(255,255,255,0.03); }
        .db-file-actions {
          display: flex; gap: 6px;
          opacity: 0; transition: opacity 0.2s;
          margin-left: auto;
        }
        .db-file-row:hover .db-file-actions { opacity: 1; }
        .db-file-delete {
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.2);
          border-radius: 8px; padding: 5px;
          cursor: pointer; color: #f87171;
          display: flex; align-items: center;
        }
        .db-file-view {
          background: rgba(167,139,250,0.1);
          border: 1px solid rgba(167,139,250,0.2);
          border-radius: 8px; padding: 5px;
          cursor: pointer; color: #a78bfa;
          display: flex; align-items: center;
        }
        .db-file-view:hover { background: rgba(167,139,250,0.2); }
        .db-file-delete:hover { background: rgba(248,113,113,0.2); }

        /* Modal styles */
        .db-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.85);
 backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex; align-items: center; justify-content: center;
          animation: dbFadeIn 0.2s ease;
        }
        @keyframes dbFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .db-modal {
          background: #0d0d1c;
          border: 1px solid rgba(167,139,250,0.2);
          border-radius: 20px;
          width: 90%;
          max-width: 1000px;
          height: 85vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .db-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.2);
        }
        .db-modal-title {
          font-family: 'Lora', serif;
          font-size: 16px;
          font-weight: 600;
          color: white;
        }
        .db-modal-close {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 6px;
          cursor: pointer;
          color: rgba(255,255,255,0.6);
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }
        .db-modal-close:hover {
          background: rgba(248,113,113,0.15);
          color: #f87171;
          border-color: rgba(248,113,113,0.3);
        }
        .db-modal-content {
          flex: 1;
          overflow: auto;
          padding: 20px;
        }
        .db-pdf-viewer {
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 12px;
        }
        .db-image-viewer {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        .db-image-viewer img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 12px;
        }
        .db-unsupported {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 20px;
          text-align: center;
        }

        /* Empty state */
        .db-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 14px; padding: 80px 24px;
          text-align: center;
        }
        .db-empty-icon {
          width: 60px; height: 60px; border-radius: 50%;
          background: rgba(167,139,250,0.08);
          border: 1px solid rgba(167,139,250,0.18);
          display: flex; align-items: center; justify-content: center;
          color: #a78bfa;
        }

        /* Chat placeholder */
        .db-chat-box {
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px;
          background: rgba(167,139,250,0.04);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 16px; padding: 80px 24px;
          text-align: center;
        }
        .db-chat-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(167,139,250,0.12);
          border: 1.5px solid rgba(167,139,250,0.3);
          display: flex; align-items: center; justify-content: center;
        }
        .db-chat-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 28px;
          background: #a78bfa; color: #0a0a14;
          border: none; border-radius: 12px;
          font-size: 14px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
        }
        .db-chat-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(167,139,250,0.35); }

        /* Spinner */
        @keyframes dbSpinFast { to { transform: rotate(360deg); } }
        .db-spinner { animation: dbSpinFast 0.9s linear infinite; }

        /* Dropdown overrides */
        .db-dropdown {
          background: #111120 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: white !important;
          min-width: 180px;
        }

        /* Badge text */
        .mood-badge {
          font-size: 11px; font-weight: 500;
          padding: 2px 10px; border-radius: 999px;
          text-transform: capitalize;
          border: 1px solid;
        }

        /* Stats row */
        .db-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px; margin-bottom: 32px;
        }
        .db-stat-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 18px 20px;
          transition: background 0.2s, transform 0.2s;
        }
        .db-stat-card:hover { background: rgba(255,255,255,0.07); transform: translateY(-2px); }
        .db-stat-num { font-family: 'Lora', serif; font-size: 2rem; font-weight: 700; color: #a78bfa; line-height: 1; margin-bottom: 4px; }
        .db-stat-label { font-size: 12px; color: rgba(255,255,255,0.4); }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="db-root">
        <div className="db-grid" />
        <div className="db-orb" style={{ width: 500, height: 500, top: -160, left: -120, background: "#1a1a3e" }} />
        <div className="db-orb" style={{ width: 400, height: 400, bottom: "5%", right: -100, background: "#111130" }} />

        {/* ── NAVBAR ── */}
        <nav className="db-nav">
          <div className="db-nav-inner">
            {/* Logo */}
            <Link href="/" className="db-logo">
              <div className="db-logo-ring">🌀</div>
              <span className="db-logo-text">EmoSoul</span>
            </Link>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="db-user-btn">
                  <Avatar style={{ width: 28, height: 28 }}>
                    <AvatarFallback style={{ background: "rgba(167,139,250,0.2)", color: "#a78bfa", fontSize: 11, fontWeight: 700 }}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {displayName ?? user?.email ?? "Account"}
                  </span>
                  <ChevronDown size={13} style={{ opacity: 0.5 }} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="db-dropdown">
                <DropdownMenuLabel style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 400 }}>
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator style={{ background: "rgba(255,255,255,0.08)" }} />
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  style={{ cursor: "pointer", color: "", fontSize: 13 }}
                >
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator style={{ background: "rgba(255,255,255,0.08)" }} />
                <DropdownMenuItem
                  onClick={handleLogout}
                  style={{ cursor: "pointer", color: "#f87171", fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}
                >
                  <LogOut size={13} /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        {/* ── MAIN ── */}
        <main className="db-main">

          {/* Welcome */}
          <div className="db-welcome">
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: "#a78bfa", marginBottom: 6 }}>
              Dashboard
            </p>
            <h1 className="lora" style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700, marginBottom: 6 }}>
              Hello,{" "}
              <span style={{ color: "#a78bfa", fontStyle: "italic" }}>
                {displayName ?? user?.email?.split("@")[0] ?? "friend"}
              </span>{" "}
              👋
            </h1>
            <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14 }}>
              Here&apos;s a look at your emotional journey.
            </p>
          </div>

          {/* Stats */}
          <div className="db-stats">
            {[
              { num: moodEntries.length, label: "Mood Entries" },
              { num: notes.length,       label: "Notes" },
              { num: files.length,       label: "Files" },
              { num: notes.filter((n) => n.isPinned).length, label: "Pinned Notes" },
            ].map((s) => (
              <div key={s.label} className="db-stat-card">
                <div className="db-stat-num">{s.num}</div>
                <div className="db-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div className="db-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`db-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── MOOD TAB ── */}
          {activeTab === "mood" && (
            <div>
              <div className="db-section-header">
                <span className="db-section-title">Mood Journal</span>
                <button className="db-add-btn" onClick={() => router.push("/moods")}>
                  <Plus size={14} /> Log Mood
                </button>
              </div>

              {moodLoading ? (
                <LoadingSpinner />
              ) : moodEntries.length === 0 ? (
                <EmptyState
                  icon={<TrendingUp size={24} />}
                  title="No mood entries yet"
                  desc="Start tracking how you feel each day."
                  btnLabel="Log your first mood"
                  onAction={() => router.push("/moods")}
                />
              ) : (
                <div>
                  {moodEntries.map((entry) => {
                    const c = MOOD_COLORS[entry.sentiment] ?? MOOD_COLORS.neutral;
                    return (
                      <div
                        key={entry._id}
                        className="db-mood-card"
                        style={{ backgroundColor: c.bg, borderColor: c.border }}
                      >
                        <div className="db-mood-emoji" style={{ background: `${c.border}` }}>
                          {c.emoji}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                            <span className="mood-badge" style={{ color: c.text, borderColor: c.border, background: c.bg }}>
                              {entry.sentiment}
                            </span>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                              Intensity: {entry.intensity}/10
                            </span>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>
                              {formatDate(entry.createdAt)}
                            </span>
                          </div>
                          {entry.text && (
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                              {entry.text}
                            </p>
                          )}
                        </div>
                        <button
                          className="db-mood-delete"
                          onClick={() => handleDeleteMood(entry._id)}
                          disabled={deletingId === entry._id}
                        >
                          {deletingId === entry._id
                            ? <Loader2 size={13} className="db-spinner" />
                            : <Trash2 size={13} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── NOTES TAB ── */}
          {activeTab === "notes" && (
            <div>
              <div className="db-section-header">
                <span className="db-section-title">Notes</span>
                <button className="db-add-btn" onClick={() => router.push("/notes/new")}>
                  <Plus size={14} /> New Note
                </button>
              </div>

              {notesLoading ? (
                <LoadingSpinner />
              ) : sortedNotes.length === 0 ? (
                <EmptyState
                  icon={<FileText size={24} />}
                  title="No notes yet"
                  desc="Capture your thoughts and ideas."
                  btnLabel="Create your first note"
                  onAction={() => router.push("/notes/new")}
                />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                  {sortedNotes.map((note) => (
                    <Card
                      key={note._id}
                      className="db-note-card"
                      onClick={() => router.push(`/notes/${note._id}`)}
                    >
                      {/* Pin indicator */}
                      {note.isPinned && (
                        <div style={{ position: "absolute", top: 12, left: 12, width: 6, height: 6, borderRadius: "50%", background: "#a78bfa" }} />
                      )}

                      {/* Hover actions */}
                      <div className="db-note-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="db-icon-btn pin"
                          onClick={() => handleTogglePin(note._id, note.isPinned)}
                          title={note.isPinned ? "Unpin" : "Pin"}
                        >
                          <Pin size={12} />
                        </button>
                        <button
                          className="db-icon-btn"
                          onClick={() => handleDeleteNote(note._id)}
                          disabled={deletingId === note._id}
                        >
                          {deletingId === note._id
                            ? <Loader2 size={12} className="db-spinner" />
                            : <Trash2 size={12} />}
                        </button>
                      </div>

                      <CardHeader style={{ padding: "20px 18px 8px" }}>
                        <CardTitle style={{ fontSize: 15, fontWeight: 600, color: "white", lineHeight: 1.4, paddingRight: 40, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                          {note.title || "Untitled"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent style={{ padding: "0 18px 18px" }}>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", lineHeight: 1.65, marginBottom: 12, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {note.content}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          {note.tags?.slice(0, 3).map((tag) => (
                            <span key={tag} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa" }}>
                              {tag}
                            </span>
                          ))}
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: "auto" }}>
                            {formatDate(note.createdAt)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── FILES TAB ── */}
          {activeTab === "files" && (
            <div>
              <div className="db-section-header">
                <span className="db-section-title">Files</span>
                <button className="db-add-btn" onClick={() => router.push("/file/upload")}>
                  <Plus size={14} /> Upload
                </button>
              </div>

              {filesLoading ? (
                <LoadingSpinner />
              ) : files.length === 0 ? (
                <EmptyState
                  icon={<FolderOpen size={24} />}
                  title="No files yet"
                  desc="Upload documents, images, and more."
                  btnLabel="Upload your first file"
                  onAction={() => router.push("/file/upload")}
                />
              ) : (
                <div>
                  {Object.entries(filesByFolder).map(([folder, folderFiles]) => (
                    <div key={folder} className="db-folder">
                      <button className="db-folder-header" onClick={() => toggleFolder(folder)}>
                        {expandedFolders[folder]
                          ? <ChevronDown size={15} style={{ color: "#a78bfa" }} />
                          : <ChevronRight size={15} style={{ color: "rgba(255,255,255,0.4)" }} />}
                        <FolderOpen size={15} style={{ color: "#a78bfa" }} />
                        <span>{folder}</span>
                        <span style={{ marginLeft: "auto", fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa" }}>
                          {folderFiles.length}
                        </span>
                      </button>

                      {expandedFolders[folder] && folderFiles.map((file) => (
                        <div key={file._id} className="db-file-row">
                          <FileText size={15} style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {file.originalName}
                            </p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, marginTop: 2 }}>
                              {formatSize(file.fileSize)} · {formatDate(file.createdAt)}
                            </p>
                          </div>
                          <div className="db-file-actions">
                            <button
                              className="db-file-view"
                              onClick={() => handleViewFile(file)}
                              title="View file"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              className="db-file-delete"
                              onClick={() => handleDeleteFile(file._id)}
                              disabled={deletingId === file._id}
                              title="Delete file"
                            >
                              {deletingId === file._id
                                ? <Loader2 size={13} className="db-spinner" />
                                : <Trash2 size={13} />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CHAT TAB ── */}
          {activeTab === "chat" && (
            <div>
              <div className="db-section-header">
                <span className="db-section-title">AI Chat</span>
              </div>
              <div className="db-chat-box">
                <div className="db-chat-icon">
                  <Brain size={28} style={{ color: "#a78bfa" }} />
                </div>
                <div>
                  <p style={{ fontFamily: "'Lora', serif", fontSize: "1.2rem", fontWeight: 700, marginBottom: 6 }}>
                    Your AI companion
                  </p>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", maxWidth: 380, lineHeight: 1.7, margin: 0 }}>
                    Chat with your personal AI to reflect on your mood, explore your notes, or just talk.
                  </p>
                </div>
                <button className="db-chat-btn" onClick={() => router.push("/chat")}>
                  <Sparkles size={15} />
                  Start chatting
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── FILE VIEWER MODAL ── */}
      {isViewerOpen && selectedFile && (
        <div className="db-modal-overlay" onClick={() => setIsViewerOpen(false)}>
          <div className="db-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-header">
              <div className="db-modal-title">{selectedFile.originalName}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="db-modal-close"
                  onClick={() => handleDownloadFile(selectedFile)}
                  title="Download"
                >
                  <Download size={16} />
                </button>
                <button
                  className="db-modal-close"
                  onClick={() => setIsViewerOpen(false)}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="db-modal-content">
              {selectedFile.fileType === 'pdf' && selectedFile.url && (
                <iframe
                  src={`${selectedFile.url}#toolbar=0`}
                  className="db-pdf-viewer"
                  title={selectedFile.originalName}
                />
              )}
              {selectedFile.fileType === 'image' && selectedFile.url && (
                <div className="db-image-viewer">
                  <img src={selectedFile.url} alt={selectedFile.originalName} />
                </div>
              )}
              {selectedFile.fileType === 'video' && selectedFile.url && (
                <video controls style={{ width: '100%', height: '100%', borderRadius: '12px' }}>
                  <source src={selectedFile.url} type={`video/${selectedFile.originalName.split('.').pop()}`} />
                  Your browser does not support the video tag.
                </video>
              )}
              {(!selectedFile.url || selectedFile.fileType === 'other') && (
                <div className="db-unsupported">
                  <div className="db-empty-icon">
                    <FileText size={32} />
                  </div>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
                    Preview not available for this file type
                  </p>
                  <button
                    className="db-chat-btn"
                    onClick={() => handleDownloadFile(selectedFile)}
                    style={{ padding: "10px 20px", fontSize: "13px" }}
                  >
                    <Download size={14} />
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Helper components ─────────────────────────────────────

function LoadingSpinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
      <Loader2 size={22} style={{ color: "#a78bfa", animation: "dbSpinFast 0.9s linear infinite" }} />
    </div>
  );
}

function EmptyState({ icon, title, desc, btnLabel, onAction }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  btnLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="db-empty">
      <div className="db-empty-icon">{icon}</div>
      <div>
        <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", margin: 0 }}>{desc}</p>
      </div>
      <button
        onClick={onAction}
        style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 22px", background: "#a78bfa", color: "#0a0a14", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(167,139,250,0.35)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
      >
        <Plus size={14} />
        {btnLabel}
      </button>
    </div>
  );
}
