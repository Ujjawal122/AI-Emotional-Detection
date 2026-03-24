"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post("/api/auth/forget-password", { email });
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        .fp-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: linear-gradient(135deg, #09090f 0%, #0d0d1c 50%, #09090f 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .fp-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.16;
          pointer-events: none;
          z-index: 0;
        }
        .fp-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image: radial-gradient(circle, rgba(167,139,250,0.07) 1px, transparent 1px);
          background-size: 36px 36px;
          pointer-events: none;
        }

        .fp-wrap {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          animation: fpFadeUp 0.65s ease both;
        }
        @keyframes fpFadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Logo */
        .fp-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 28px;
          text-decoration: none;
        }
        .fp-logo-ring {
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(167,139,250,0.12);
          border: 1.5px solid rgba(167,139,250,0.4);
          font-size: 16px;
          animation: fpSpin 14s linear infinite;
        }
        @keyframes fpSpin { to { transform: rotate(360deg); } }
        .fp-logo-text {
          font-family: 'Lora', serif;
          font-size: 22px;
          font-weight: 700;
          color: #a78bfa;
        }

        /* Card */
        .fp-card {
          background: rgba(255,255,255,0.035) !important;
          border: 1px solid rgba(255,255,255,0.09) !important;
          border-radius: 22px !important;
          backdrop-filter: blur(20px) !important;
          box-shadow: 0 24px 60px rgba(0,0,0,0.45) !important;
          overflow: hidden;
          position: relative;
        }
        .fp-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(167,139,250,0.4), transparent);
          pointer-events: none;
        }
        .fp-card-header {
          padding: 32px 32px 16px !important;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .fp-card-title {
          font-family: 'Lora', serif !important;
          font-size: 1.65rem !important;
          font-weight: 700 !important;
          color: white !important;
          letter-spacing: -0.01em;
        }
        .fp-card-desc {
          color: rgba(255,255,255,0.42) !important;
          font-size: 14px !important;
          margin-top: 5px !important;
          line-height: 1.6;
        }
        .fp-card-content {
          padding: 28px 32px 32px !important;
        }

        /* Label */
        .fp-label {
          color: rgba(255,255,255,0.65) !important;
          font-size: 13px !important;
          font-weight: 500 !important;
        }

        /* Input */
        .fp-input {
          background: rgba(255,255,255,0.055) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 10px !important;
          color: white !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 14px !important;
          height: 44px !important;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
        }
        .fp-input::placeholder { color: rgba(255,255,255,0.2) !important; }
        .fp-input:focus {
          border-color: rgba(167,139,250,0.55) !important;
          background: rgba(167,139,250,0.07) !important;
          box-shadow: 0 0 0 3px rgba(167,139,250,0.12) !important;
          outline: none !important;
        }

        /* Submit btn */
        .fp-btn {
          width: 100%;
          height: 46px;
          border-radius: 12px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          font-family: 'DM Sans', sans-serif !important;
          background: #a78bfa !important;
          color: #0a0a14 !important;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s !important;
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .fp-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(167,139,250,0.35) !important;
        }
        .fp-btn:disabled { opacity: 0.55 !important; cursor: not-allowed; }

        /* Error */
        .fp-error {
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

        /* Success state */
        .fp-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 8px 0 4px;
          gap: 16px;
          animation: fpFadeUp 0.5s ease both;
        }
        .fp-success-icon-wrap {
          width: 64px; height: 64px;
          border-radius: 50%;
          background: rgba(52,211,153,0.12);
          border: 1.5px solid rgba(52,211,153,0.3);
          display: flex; align-items: center; justify-content: center;
        }
        .fp-success-title {
          font-family: 'Lora', serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: white;
        }
        .fp-success-desc {
          font-size: 14px;
          color: rgba(255,255,255,0.42);
          line-height: 1.7;
          max-width: 320px;
        }
        .fp-success-email {
          font-weight: 600;
          color: rgba(255,255,255,0.7);
        }
        .fp-success-note {
          font-size: 12px;
          color: rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 10px 14px;
          line-height: 1.6;
          width: 100%;
        }

        /* Info hint box */
        .fp-hint {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: rgba(167,139,250,0.06);
          border: 1px solid rgba(167,139,250,0.15);
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 20px;
        }
        .fp-hint-icon { font-size: 15px; margin-top: 1px; flex-shrink: 0; }
        .fp-hint-text { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.6; }

        /* Back link */
        .fp-back {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          text-decoration: none;
          margin-top: 20px;
          justify-content: center;
          transition: color 0.2s;
        }
        .fp-back:hover { color: #a78bfa; }

        /* Mood strip */
        .fp-mood-strip {
          display: flex; gap: 6px; align-items: center;
          padding: 14px 32px;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(167,139,250,0.04);
        }
        .fp-mood-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          animation: fpPulse 2.4s ease-in-out infinite;
        }
        @keyframes fpPulse { 0%,100%{opacity:.3} 50%{opacity:1} }
        .fp-mood-dot:nth-child(2) { animation-delay: 0.4s; }
        .fp-mood-dot:nth-child(3) { animation-delay: 0.8s; }
        .fp-mood-hint { font-size: 11px; color: rgba(255,255,255,0.28); letter-spacing: 0.02em; margin-left: 4px; }

        .fp-link { color: #a78bfa; text-decoration: none; font-weight: 500; transition: opacity 0.2s; }
        .fp-link:hover { opacity: 0.75; text-decoration: underline; }
      `}</style>

      <div className="fp-root">
        <div className="fp-grid" />
        <div className="fp-orb" style={{ width: 560, height: 560, top: -180, left: -160, background: "#1a1a3e" }} />
        <div className="fp-orb" style={{ width: 420, height: 420, bottom: -100, right: -120, background: "#111130" }} />
        <div className="fp-orb" style={{ width: 260, height: 260, top: "38%", left: "58%", background: "#1a1a3e", opacity: "0.08" }} />

        <div className="fp-wrap">
          {/* Logo */}
          <Link href="/" className="fp-logo">
            <div className="fp-logo-ring">🌀</div>
            <span className="fp-logo-text">EmoSoul</span>
          </Link>

          <Card className="fp-card">
            <CardHeader className="fp-card-header">
              <CardTitle className="fp-card-title">
                {sent ? "Check your inbox" : "Forgot password?"}
              </CardTitle>
              <CardDescription className="fp-card-desc">
                {sent
                  ? "We've sent a reset link to your email."
                  : "No worries — we'll send you a reset link valid for 15 minutes."}
              </CardDescription>
            </CardHeader>

            <CardContent className="fp-card-content">
              {sent ? (
                /* ── Success state ── */
                <div className="fp-success">
                  <div className="fp-success-icon-wrap">
                    <CheckCircle2 size={28} color="#34d399" />
                  </div>
                  <p className="fp-success-title">Reset link sent!</p>
                  <p className="fp-success-desc">
                    We emailed a password reset link to{" "}
                    <span className="fp-success-email">{email}</span>.
                    Open it within 15 minutes to reset your password.
                  </p>
                  <p className="fp-success-note">
                    Can't find it? Check your spam or junk folder. The link expires in 15 minutes.
                  </p>
                  <Button
                    className="fp-btn"
                    style={{ marginTop: 4 }}
                    onClick={() => { setSent(false); setEmail(""); }}
                  >
                    <Mail size={15} />
                    Try a different email
                  </Button>
                </div>
              ) : (
                /* ── Form state ── */
                <>
                  <div className="fp-hint">
                    <span className="fp-hint-icon">🔐</span>
                    <span className="fp-hint-text">
                      Enter the email address linked to your EmoSoul account and we'll send you a secure reset link.
                    </span>
                  </div>

                  <form className="space-y-5" onSubmit={onSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="fp-label">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="fp-input"
                      />
                    </div>

                    {error && (
                      <div className="fp-error">
                        <span style={{ marginTop: 1 }}>⚠</span>
                        <span>{error}</span>
                      </div>
                    )}

                    <Button type="submit" disabled={loading} className="fp-btn" style={{ marginTop: 4 }}>
                      {loading ? (
                        <>
                          <Loader2 size={15} style={{ animation: "fpSpin 0.8s linear infinite" }} />
                          Sending reset link...
                        </>
                      ) : (
                        <>
                          <Mail size={15} />
                          Send reset link
                        </>
                      )}
                    </Button>
                  </form>

                  <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                    Remembered it?{" "}
                    <Link href="/login" className="fp-link">Back to login</Link>
                  </p>
                </>
              )}
            </CardContent>

            {/* Mood strip */}
            <div className="fp-mood-strip">
              <div className="fp-mood-dot" style={{ background: "#a78bfa" }} />
              <div className="fp-mood-dot" style={{ background: "#60a5fa" }} />
              <div className="fp-mood-dot" style={{ background: "#34d399" }} />
              <span className="fp-mood-hint">
                {sent ? "Reset link is on its way" : "Your account is safe with us"}
              </span>
            </div>
          </Card>

          {/* Back arrow */}
          <Link href="/login" className="fp-back">
            <ArrowLeft size={14} />
            Back to login
          </Link>
        </div>
      </div>
    </>
  );
}