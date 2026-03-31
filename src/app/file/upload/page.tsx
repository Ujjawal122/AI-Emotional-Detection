"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  Image,
  File,
  X,
  CheckCircle2,
  Loader2,
  FolderOpen,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const FOLDERS = [
  "Documents",
  "Images",
  "Journal",
  "Medical",
  "Personal",
  "Work",
  "Uncategorized",
];

const MAX_SIZE_MB = 10;

function getFileIcon(mime: string) {
  if (mime.startsWith("image/"))         return <Image   size={18} />;
  if (mime === "application/pdf")        return <FileText size={18} />;
  if (mime.includes("word") || mime.includes("document")) return <FileText size={18} />;
  return <File size={18} />;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024, s = ["B", "KB", "MB"], i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + s[i];
}

export default function UploadPage() {
  const router  = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [folder,       setFolder]       = useState("Uncategorized");
  const [uploading,    setUploading]    = useState(false);
  const [success,      setSuccess]      = useState(false);
  const [error,        setError]        = useState("");
  const [dragOver,     setDragOver]     = useState(false);
  const [progress,     setProgress]     = useState(0);

  const handleFile = (file: File) => {
    setError("");
    setSuccess(false);
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }
    setSelectedFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setError("");
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file",   selectedFile);
      formData.append("folder", folder);

      await axios.post("/api/files/upload", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / (e.total ?? 1));
          setProgress(pct);
        },
      });

      setSuccess(true);
      setSelectedFile(null);
      setProgress(100);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #09090f; }

        .up-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: linear-gradient(135deg, #09090f 0%, #0d0d1c 50%, #09090f 100%);
          color: white;
          overflow-x: hidden;
          position: relative;
        }

        .up-orb {
          position: fixed; border-radius: 50%; filter: blur(90px);
          opacity: 0.14; pointer-events: none; z-index: 0;
        }
        .up-grid {
          position: fixed; inset: 0; z-index: 0;
          background-image: radial-gradient(circle, rgba(167,139,250,0.06) 1px, transparent 1px);
          background-size: 36px 36px; pointer-events: none;
        }

        /* Navbar */
        .up-nav {
          position: sticky; top: 0; z-index: 50;
          background: rgba(9,9,15,0.72);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .up-nav-inner {
          max-width: 900px; margin: 0 auto;
          padding: 0 24px; height: 58px;
          display: flex; align-items: center; gap: 16px;
        }
        .up-back {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: rgba(255,255,255,0.45);
          text-decoration: none; transition: color 0.2s;
        }
        .up-back:hover { color: #a78bfa; }

        @keyframes upSpin { to { transform: rotate(360deg); } }
        .up-logo-ring {
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(167,139,250,0.12);
          border: 1.5px solid rgba(167,139,250,0.4);
          font-size: 13px;
          animation: upSpin 14s linear infinite;
        }
        .up-logo-text {
          font-family: 'Lora', serif; font-size: 18px;
          font-weight: 700; color: #a78bfa;
        }

        /* Main */
        .up-main {
          position: relative; z-index: 10;
          max-width: 580px; margin: 0 auto;
          padding: 40px 24px 80px;
          animation: upFadeUp 0.6s ease both;
        }
        @keyframes upFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Card */
        .up-card {
          background: rgba(255,255,255,0.035) !important;
          border: 1px solid rgba(255,255,255,0.09) !important;
          border-radius: 22px !important;
          backdrop-filter: blur(20px) !important;
          box-shadow: 0 24px 60px rgba(0,0,0,0.45) !important;
          position: relative; overflow: hidden;
        }
        .up-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(167,139,250,0.4), transparent);
          pointer-events: none;
        }
        .up-card-header { padding: 28px 28px 14px !important; border-bottom: 1px solid rgba(255,255,255,0.07); }
        .up-card-title  { font-family: 'Lora', serif !important; font-size: 1.55rem !important; font-weight: 700 !important; color: white !important; }
        .up-card-desc   { color: rgba(255,255,255,0.4) !important; font-size: 14px !important; margin-top: 4px !important; line-height: 1.6; }
        .up-card-content { padding: 24px 28px 28px !important; }

        /* Drop zone */
        .up-dropzone {
          border: 2px dashed rgba(167,139,250,0.25);
          border-radius: 16px;
          padding: 40px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s ease;
          background: rgba(167,139,250,0.04);
          position: relative;
        }
        .up-dropzone:hover, .up-dropzone.drag-over {
          border-color: rgba(167,139,250,0.6);
          background: rgba(167,139,250,0.09);
        }
        .up-dropzone.has-file {
          border-style: solid;
          border-color: rgba(167,139,250,0.35);
          background: rgba(167,139,250,0.06);
        }
        .up-drop-icon {
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(167,139,250,0.12);
          border: 1.5px solid rgba(167,139,250,0.25);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
          color: #a78bfa;
          transition: all 0.25s;
        }
        .up-dropzone:hover .up-drop-icon { background: rgba(167,139,250,0.2); }

        /* File preview row */
        .up-file-preview {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px;
          background: rgba(167,139,250,0.08);
          border: 1px solid rgba(167,139,250,0.2);
          border-radius: 12px;
          margin-top: 16px;
        }
        .up-file-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(167,139,250,0.15);
          display: flex; align-items: center; justify-content: center;
          color: #a78bfa; flex-shrink: 0;
        }
        .up-file-remove {
          margin-left: auto;
          padding: 4px; border-radius: 8px;
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.2);
          color: #f87171; cursor: pointer;
          display: flex; align-items: center;
          transition: background 0.2s;
        }
        .up-file-remove:hover { background: rgba(248,113,113,0.2); }

        /* Label */
        .up-label { color: rgba(255,255,255,0.6) !important; font-size: 13px !important; font-weight: 500 !important; }

        /* Select */
        .up-select {
          width: 100%;
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          height: 44px;
          padding: 0 12px;
          outline: none;
          cursor: pointer;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
          appearance: none;
        }
        .up-select:focus {
          border-color: rgba(167,139,250,0.55);
          background: rgba(167,139,250,0.07);
          box-shadow: 0 0 0 3px rgba(167,139,250,0.12);
        }
        .up-select option { background: #111120; }

        /* Progress bar */
        .up-progress-wrap {
          height: 4px; border-radius: 2px;
          background: rgba(255,255,255,0.08);
          overflow: hidden; margin-top: 8px;
        }
        .up-progress-bar {
          height: 100%; border-radius: 2px;
          background: #a78bfa;
          transition: width 0.3s ease;
        }

        /* Error / Success */
        .up-error {
          display: flex; align-items: flex-start; gap: 8px;
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.25);
          border-radius: 10px; padding: 10px 14px;
          color: #fca5a5; font-size: 13px; line-height: 1.5;
        }
        .up-success {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 24px 0 8px; text-align: center;
          animation: upFadeUp 0.5s ease both;
        }

        /* Upload btn */
        .up-btn {
          width: 100%; height: 46px;
          border-radius: 12px !important;
          font-size: 14px !important; font-weight: 600 !important;
          font-family: 'DM Sans', sans-serif !important;
          background: #a78bfa !important; color: #0a0a14 !important;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s !important;
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .up-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(167,139,250,0.35) !important; }
        .up-btn:disabled { opacity: 0.45 !important; cursor: not-allowed; }

        @keyframes upSpinFast { to { transform: rotate(360deg); } }
        .up-spinner { animation: upSpinFast 0.8s linear infinite; }

        /* Mood strip */
        .up-strip {
          display: flex; gap: 6px; align-items: center;
          padding: 14px 28px;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(167,139,250,0.04);
        }
        .up-dot { width: 6px; height: 6px; border-radius: 50%; animation: upPulse 2.4s ease-in-out infinite; }
        @keyframes upPulse { 0%,100%{opacity:.3} 50%{opacity:1} }
        .up-dot:nth-child(2) { animation-delay: 0.4s; }
        .up-dot:nth-child(3) { animation-delay: 0.8s; }
      `}</style>

      <div className="up-root">
        <div className="up-grid" />
        <div className="up-orb" style={{ width: 520, height: 520, top: -160, left: -130, background: "#1a1a3e" }} />
        <div className="up-orb" style={{ width: 380, height: 380, bottom: "-5%", right: -100, background: "#111130" }} />

        {/* Navbar */}
        <nav className="up-nav">
          <div className="up-nav-inner">
            <Link href="/dashboard" className="up-back">
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
              <div className="up-logo-ring">🌀</div>
              <span className="up-logo-text">EmoSoul</span>
            </div>
          </div>
        </nav>

        {/* Main */}
        <main className="up-main">
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: "#a78bfa", marginBottom: 6 }}>
            Files
          </p>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 700, marginBottom: 24 }}>
            Upload a file
          </h1>

          <Card className="up-card">
            <CardHeader className="up-card-header">
              <CardTitle className="up-card-title">Choose your file</CardTitle>
              <CardDescription className="up-card-desc">
                Supports PDF, Word, Excel, images, and text files up to {MAX_SIZE_MB} MB.
              </CardDescription>
            </CardHeader>

            <CardContent className="up-card-content">
              {success ? (
                /* ── Success state ── */
                <div className="up-success">
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(52,211,153,0.12)", border: "1.5px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle2 size={28} color="#34d399" />
                  </div>
                  <p style={{ fontFamily: "'Lora', serif", fontSize: "1.2rem", fontWeight: 700 }}>Uploaded successfully!</p>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
                    Your file has been saved to Cloudinary and is accessible from your dashboard.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
                    <button
                      onClick={() => { setSuccess(false); setProgress(0); }}
                      style={{ padding: "10px 22px", background: "#a78bfa", color: "#0a0a14", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}
                    >
                      Upload another
                    </button>
                    <button
                      onClick={() => router.push("/dashboard")}
                      style={{ padding: "10px 22px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)", borderRadius: 12, fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Drop zone */}
                  <div
                    className={`up-dropzone ${dragOver ? "drag-over" : ""} ${selectedFile ? "has-file" : ""}`}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onClick={() => !selectedFile && inputRef.current?.click()}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      style={{ display: "none" }}
                      onChange={onInputChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
                    />
                    <div className="up-drop-icon">
                      <Upload size={22} />
                    </div>
                    <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                      {dragOver ? "Drop it here!" : "Drag & drop your file"}
                    </p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                      or{" "}
                      <span
                        style={{ color: "#a78bfa", cursor: "pointer", textDecoration: "underline" }}
                        onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                      >
                        browse to upload
                      </span>
                    </p>
                  </div>

                  {/* File preview */}
                  {selectedFile && (
                    <div className="up-file-preview">
                      <div className="up-file-icon">
                        {getFileIcon(selectedFile.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {selectedFile.name}
                        </p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0, marginTop: 2 }}>
                          {formatBytes(selectedFile.size)}
                        </p>
                      </div>
                      <button
                        className="up-file-remove"
                        onClick={() => { setSelectedFile(null); setError(""); if (inputRef.current) inputRef.current.value = ""; }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}

                  {/* Folder selector */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <Label className="up-label">
                      <FolderOpen size={13} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
                      Save to folder
                    </Label>
                    <select
                      className="up-select"
                      value={folder}
                      onChange={(e) => setFolder(e.target.value)}
                    >
                      {FOLDERS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  {/* Progress bar */}
                  {uploading && (
                    <div>
                      <div className="up-progress-wrap">
                        <div className="up-progress-bar" style={{ width: `${progress}%` }} />
                      </div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 6, textAlign: "right" }}>
                        {progress}%
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="up-error">
                      <span style={{ marginTop: 1 }}>⚠</span>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Upload button */}
                  <Button
                    className="up-btn"
                    disabled={!selectedFile || uploading}
                    onClick={handleUpload}
                    style={{ marginTop: 4 }}
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={15} className="up-spinner" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={15} />
                        Upload to Cloud
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>

            {/* Mood strip */}
            <div className="up-strip">
              <div className="up-dot" style={{ background: "#a78bfa" }} />
              <div className="up-dot" style={{ background: "#60a5fa" }} />
              <div className="up-dot" style={{ background: "#34d399" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", letterSpacing: "0.02em", marginLeft: 4 }}>
                {uploading ? "Uploading to Cloudinary..." : "Your files are stored securely"}
              </span>
            </div>
          </Card>
        </main>
      </div>
    </>
  );
}