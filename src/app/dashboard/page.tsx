"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FolderOpen,
  FileText,
  Calendar,
  TrendingUp,
  MessageCircle,
  LogOut,
  Loader2,
  Pin,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";

interface User {
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
}

const MOOD_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  happy: { bg: "rgba(52,211,153,0.15)", border: "rgba(52,211,153,0.4)", text: "#34d399" },
  excited: { bg: "rgba(251,191,36,0.15)", border: "rgba(251,191,36,0.4)", text: "#fbbf24" },
  neutral: { bg: "rgba(167,139,250,0.15)", border: "rgba(167,139,250,0.4)", text: "#a78bfa" },
  sad: { bg: "rgba(96,165,250,0.15)", border: "rgba(96,165,250,0.4)", text: "#60a5fa" },
  low: { bg: "rgba(148,163,184,0.15)", border: "rgba(148,163,184,0.4)", text: "#94a3b8" },
  stressed: { bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.4)", text: "#f87171" },
  anxious: { bg: "rgba(251,146,60,0.15)", border: "rgba(251,146,60,0.4)", text: "#fb923c" },
  angry: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", text: "#ef4444" },
};

const formatSize = (b: number) => {
  if (b === 0) return "0 B";
  const k = 1024,
    s = ["B", "KB", "MB", "GB"],
    i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + " " + s[i];
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

type TabType = "mood" | "notes" | "files" | "chat";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("mood");

  // Data states
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  // UI states
  const [moodLoading, setMoodLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  // Fetch data when tab changes
  useEffect(() => {
    if (!user) return;
    if (activeTab === "mood") fetchMoodEntries();
    else if (activeTab === "notes") fetchNotes();
    else if (activeTab === "files") fetchFiles();
  }, [activeTab, user]);

  const fetchMoodEntries = async () => {
    setMoodLoading(true);
    try {
      const res = await fetch("/api/mood");
      if (res.ok) {
        const data = await res.json();
        setMoodEntries(data.entries ?? []);
      }
    } finally {
      setMoodLoading(false);
    }
  };

  const fetchNotes = async () => {
    setNotesLoading(true);
    try {
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes ?? []);
      }
    } finally {
      setNotesLoading(false);
    }
  };

  const fetchFiles = async () => {
    setFilesLoading(true);
    try {
      const res = await fetch("/api/files");
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files ?? []);
      }
    } finally {
      setFilesLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleDeleteMood = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/mood/${id}`, { method: "DELETE" });
      if (res.ok) setMoodEntries((prev) => prev.filter((e) => e._id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteNote = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) setNotes((prev) => prev.filter((n) => n._id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteFile = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (res.ok) setFiles((prev) => prev.filter((f) => f._id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !isPinned }),
      });
      if (res.ok) {
        setNotes((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isPinned: !isPinned } : n))
        );
      }
    } catch {
      /* silent */
    }
  };

  const toggleFolder = (folder: string) =>
    setExpandedFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));

  // Group files by folder
  const filesByFolder = files.reduce<Record<string, FileItem[]>>((acc, f) => {
    const key = f.folder || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "mood", label: "Mood", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "notes", label: "Notes", icon: <FileText className="w-4 h-4" /> },
    { id: "files", label: "Files", icon: <FolderOpen className="w-4 h-4" /> },
    { id: "chat", label: "Chat", icon: <MessageCircle className="w-4 h-4" /> },
  ];

  // ── Sorted notes: pinned first ──────────────────────────────────────────────
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned === b.isPinned) return 0;
    return a.isPinned ? -1 : 1;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <span className="font-semibold tracking-tight text-lg">MindSpace</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button  className="gap-2 px-2">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user?.name ?? user?.email}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                {user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Tab bar */}
        <div className="flex gap-1 mb-8 bg-muted/50 p-1 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── MOOD TAB ──────────────────────────────────────────────────────── */}
        {activeTab === "mood" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Mood Journal</h2>
              <Button  onClick={() => router.push("/mood/new")}>
                <Calendar className="w-4 h-4 mr-1.5" />
                Log Mood
              </Button>
            </div>

            {moodLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : moodEntries.length === 0 ? (
              <EmptyState
                icon={<TrendingUp className="w-8 h-8" />}
                title="No mood entries yet"
                description="Start tracking how you feel each day."
                action={
                  <Button  onClick={() => router.push("/mood/new")}>
                    Log your first mood
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-3">
                {moodEntries.map((entry) => {
                  const colors =
                    MOOD_COLORS[entry.sentiment] ?? MOOD_COLORS.neutral;
                  return (
                    <div
                      key={entry._id}
                      className="rounded-xl border p-4 flex items-start gap-4 group transition-all hover:shadow-sm"
                      style={{
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                      }}
                    >
                      <div
                        className="mt-0.5 w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: colors.border }}
                      >
                        {getMoodEmoji(entry.sentiment)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className="text-xs capitalize border-0 px-2 py-0.5"
                            style={{ color: colors.text, backgroundColor: colors.bg }}
                          >
                            {entry.sentiment}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Intensity: {entry.intensity}/10
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {formatDate(entry.createdAt)}
                          </span>
                        </div>
                        {entry.text && (
                          <p className="text-sm text-foreground/80 line-clamp-2">
                            {entry.text}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteMood(entry._id)}
                        disabled={deletingId === entry._id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex-shrink-0"
                      >
                        {deletingId === entry._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── NOTES TAB ─────────────────────────────────────────────────────── */}
        {activeTab === "notes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Notes</h2>
              <Button  onClick={() => router.push("/notes/new")}>
                <FileText className="w-4 h-4 mr-1.5" />
                New Note
              </Button>
            </div>

            {notesLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : sortedNotes.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-8 h-8" />}
                title="No notes yet"
                description="Capture your thoughts and ideas."
                action={
                  <Button  onClick={() => router.push("/notes/new")}>
                    Create your first note
                  </Button>
                }
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {sortedNotes.map((note) => (
                  <Card
                    key={note._id}
                    className="group cursor-pointer hover:shadow-md transition-all relative"
                    onClick={() => router.push(`/notes/${note._id}`)}
                  >
                    {note.isPinned && (
                      <Pin className="absolute top-3 right-10 w-3.5 h-3.5 text-primary rotate-45" />
                    )}
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-base font-medium leading-snug line-clamp-1 pr-6">
                        {note.title || "Untitled"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {note.content}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {note.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                            {tag}
                          </Badge>
                        ))}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDate(note.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                    {/* Hover actions */}
                    <div
                      className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleTogglePin(note._id, note.isPinned)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                        title={note.isPinned ? "Unpin" : "Pin"}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note._id)}
                        disabled={deletingId === note._id}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        {deletingId === note._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FILES TAB ─────────────────────────────────────────────────────── */}
        {activeTab === "files" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Files</h2>
              <Button  onClick={() => router.push("/files/upload")}>
                <FolderOpen className="w-4 h-4 mr-1.5" />
                Upload
              </Button>
            </div>

            {filesLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : files.length === 0 ? (
              <EmptyState
                icon={<FolderOpen className="w-8 h-8" />}
                title="No files yet"
                description="Upload documents, images, and more."
                action={
                  <Button  onClick={() => router.push("/files/upload")}>
                    Upload your first file
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                {Object.entries(filesByFolder).map(([folder, folderFiles]) => (
                  <div key={folder} className="border border-border/60 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleFolder(folder)}
                      className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                    >
                      {expandedFolders[folder] ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <FolderOpen className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">{folder}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {folderFiles.length}
                      </Badge>
                    </button>

                    {expandedFolders[folder] && (
                      <div className="divide-y divide-border/40">
                        {folderFiles.map((file) => (
                          <div
                            key={file._id}
                            className="flex items-center gap-3 px-4 py-2.5 group hover:bg-muted/20 transition-colors"
                          >
                            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{file.originalName}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatSize(file.fileSize)} · {formatDate(file.createdAt)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteFile(file._id)}
                              disabled={deletingId === file._id}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            >
                              {deletingId === file._id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CHAT TAB ──────────────────────────────────────────────────────── */}
        {activeTab === "chat" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">AI Chat</h2>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 flex flex-col items-center justify-center gap-4 py-20">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium mb-1">Your AI companion</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Chat with your personal AI to reflect on your mood, explore your notes, or just talk.
                </p>
              </div>
              <Button onClick={() => router.push("/chat")}>
                <MessageCircle className="w-4 h-4 mr-1.5" />
                Start chatting
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="font-medium mb-0.5">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function getMoodEmoji(sentiment: string): string {
  const map: Record<string, string> = {
    happy: "😊",
    excited: "🤩",
    neutral: "😐",
    sad: "😢",
    low: "😔",
    stressed: "😤",
    anxious: "😰",
    angry: "😠",
  };
  return map[sentiment] ?? "🙂";
}