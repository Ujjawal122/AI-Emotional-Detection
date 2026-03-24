"use client";

import { FormEvent, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Loader2, ShieldCheck, ArrowLeft, CheckCircle2, RefreshCw } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // email can be passed as ?email=xxx from signup redirect
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── OTP input handlers ──────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    // allow only digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    setError("");
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...code];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setCode(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const fullCode = code.join("");

  // ── Submit ──────────────────────────────────────────────
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (fullCode.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await axios.post("/api/auth/verifyEmail", { email, code: fullCode });
      setVerified(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend (optional — wire to your resend route if you have one) ──
  const handleResend = async () => {
    if (countdown > 0 || !email) return;
    setResending(true);
    setResendSuccess(false);
    try {
      await axios.post("/api/auth/resend-verification", { email });
      setResendSuccess(true);
      setCountdown(60);
    } catch {
      // silently fail — most apps don't show resend errors
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        .ve-root {
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

        .ve-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.16;
          pointer-events: none;
          z-index: 0;
        }
        .ve-grid {
          position: fixed; inset: 0; z-index: 0;
          background-image: radial-gradient(circle, rgba(167,139,250,0.07) 1px, transparent 1px);
          background-size: 36px 36px;
          pointer-events: none;
        }

        .ve-wrap {
          position: relative; z-index: 10;
          width: 100%; max-width: 440px;
          animation: veFadeUp 0.65s ease both;
        }
        @keyframes veFadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Logo */
        .ve-logo {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; margin-bottom: 28px; text-decoration: none;
        }
        .ve-logo-ring {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(167,139,250,0.12);
          border: 1.5px solid rgba(167,139,250,0.4);
          font-size: 16px;
          animation: veSpin 14s linear infinite;
        }
        @keyframes veSpin { to { transform: rotate(360deg); } }
        .ve-logo-text {
          font-family: 'Lora', serif;
          font-size: 22px; font-weight: 700; color: #a78bfa;
        }

        /* Card */
        .ve-card {
          background: rgba(255,255,255,0.035) !important;
          border: 1px solid rgba(255,255,255,0.09) !important;
          border-radius: 22px !important;
          backdrop-filter: blur(20px) !important;
          box-shadow: 0 24px 60px rgba(0,0,0,0.45) !important;
          overflow: hidden; position: relative;
        }
        .ve-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(167,139,250,0.4), transparent);
          pointer-events: none;
        }
        .ve-card-header {
          padding: 32px 32px 16px !important;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .ve-card-title {
          font-family: 'Lora', serif !important;
          font-size: 1.65rem !important; font-weight: 700 !important;
          color: white !important; letter-spacing: -0.01em;
        }
        .ve-card-desc {
          color: rgba(255,255,255,0.42) !important;
          font-size: 14px !important; margin-top: 5px !important; line-height: 1.6;
        }
        .ve-card-content { padding: 28px 32px 32px !important; }

        /* Email input (shown if no email in URL) */
        .ve-label {
          color: rgba(255,255,255,0.65) !important;
          font-size: 13px !important; font-weight: 500 !important;
        }
        .ve-input {
          background: rgba(255,255,255,0.055) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 10px !important;
          color: white !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 14px !important; height: 44px !important;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
        }
        .ve-input::placeholder { color: rgba(255,255,255,0.2) !important; }
        .ve-input:focus {
          border-color: rgba(167,139,250,0.55) !important;
          background: rgba(167,139,250,0.07) !important;
          box-shadow: 0 0 0 3px rgba(167,139,250,0.12) !important;
          outline: none !important;
        }

        /* OTP boxes */
        .ve-otp-wrap {
          display: flex; gap: 10px; justify-content: center;
          margin: 4px 0 8px;
        }
        .ve-otp-box {
          width: 52px; height: 58px;
          border-radius: 12px;
          background: rgba(255,255,255,0.055);
          border: 1.5px solid rgba(255,255,255,0.1);
          color: white;
          font-family: 'Lora', serif;
          font-size: 1.4rem; font-weight: 700;
          text-align: center;
          caret-color: #a78bfa;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s, transform 0.15s;
          outline: none;
        }
        .ve-otp-box:focus {
          border-color: rgba(167,139,250,0.65) !important;
          background: rgba(167,139,250,0.09) !important;
          box-shadow: 0 0 0 3px rgba(167,139,250,0.15) !important;
          transform: scale(1.06);
        }
        .ve-otp-box.filled {
          border-color: rgba(167,139,250,0.45);
          background: rgba(167,139,250,0.07);
        }
        .ve-otp-box.error-box {
          border-color: rgba(248,113,113,0.55) !important;
          background: rgba(248,113,113,0.07) !important;
        }

        /* Divider dots between groups */
        .ve-otp-sep {
          display: flex; align-items: center;
          color: rgba(255,255,255,0.2); font-size: 20px;
          padding-bottom: 4px;
        }

        /* Submit btn */
        .ve-btn {
          width: 100%; height: 46px;
          border-radius: 12px !important;
          font-size: 14px !important; font-weight: 600 !important;
          font-family: 'DM Sans', sans-serif !important;
          background: #a78bfa !important; color: #0a0a14 !important;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s !important;
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .ve-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(167,139,250,0.35) !important;
        }
        .ve-btn:disabled { opacity: 0.55 !important; cursor: not-allowed; }

        /* Error */
        .ve-error {
          display: flex; align-items: flex-start; gap: 8px;
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.25);
          border-radius: 10px; padding: 10px 14px;
          color: #fca5a5; font-size: 13px; line-height: 1.5;
        }

        /* Hint box */
        .ve-hint {
          display: flex; align-items: flex-start; gap: 10px;
          background: rgba(167,139,250,0.06);
          border: 1px solid rgba(167,139,250,0.15);
          border-radius: 10px; padding: 12px 14px; margin-bottom: 22px;
        }
        .ve-hint-text { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.6; }

        /* Resend */
        .ve-resend-row {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; margin-top: 18px;
          font-size: 13px; color: rgba(255,255,255,0.35);
        }
        .ve-resend-btn {
          background: none; border: none; padding: 0; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500;
          color: #a78bfa; display: flex; align-items: center; gap: 5px;
          transition: opacity 0.2s;
        }
        .ve-resend-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .ve-resend-btn:not(:disabled):hover { opacity: 0.75; text-decoration: underline; }

        /* Success */
        .ve-success {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; padding: 8px 0 4px; gap: 16px;
          animation: veFadeUp 0.5s ease both;
        }
        .ve-success-icon {
          width: 70px; height: 70px; border-radius: 50%;
          background: rgba(52,211,153,0.12);
          border: 1.5px solid rgba(52,211,153,0.3);
          display: flex; align-items: center; justify-content: center;
        }
        .ve-success-title {
          font-family: 'Lora', serif;
          font-size: 1.35rem; font-weight: 700; color: white;
        }
        .ve-success-desc {
          font-size: 14px; color: rgba(255,255,255,0.42);
          line-height: 1.7; max-width: 300px;
        }
        .ve-redirect-bar-wrap {
          width: 100%; background: rgba(255,255,255,0.07);
          border-radius: 6px; height: 4px; overflow: hidden;
        }
        .ve-redirect-bar {
          height: 100%; background: #34d399;
          animation: veBarFill 3s linear forwards;
          border-radius: 6px;
        }
        @keyframes veBarFill { from { width: 0% } to { width: 100% } }

        /* Mood strip */
        .ve-mood-strip {
          display: flex; gap: 6px; align-items: center;
          padding: 14px 32px;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(167,139,250,0.04);
        }
        .ve-mood-dot {
          width: 6px; height: 6px; border-radius: 50%;
          animation: vePulse 2.4s ease-in-out infinite;
        }
        @keyframes vePulse { 0%,100%{opacity:.3} 50%{opacity:1} }
        .ve-mood-dot:nth-child(2) { animation-delay: 0.4s; }
        .ve-mood-dot:nth-child(3) { animation-delay: 0.8s; }
        .ve-mood-hint { font-size: 11px; color: rgba(255,255,255,0.28); letter-spacing: 0.02em; margin-left: 4px; }

        .ve-link { color: #a78bfa; text-decoration: none; font-weight: 500; transition: opacity 0.2s; }
        .ve-link:hover { opacity: 0.75; text-decoration: underline; }
        .ve-back {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: rgba(255,255,255,0.35);
          text-decoration: none; margin-top: 20px;
          justify-content: center; transition: color 0.2s;
        }
        .ve-back:hover { color: #a78bfa; }
      `}</style>

      <div className="ve-root">
        <div className="ve-grid" />
        <div className="ve-orb" style={{ width: 560, height: 560, top: -180, left: -160, background: "#1a1a3e" }} />
        <div className="ve-orb" style={{ width: 420, height: 420, bottom: -100, right: -120, background: "#111130" }} />
        <div className="ve-orb" style={{ width: 260, height: 260, top: "38%", left: "58%", background: "#1a1a3e", opacity: "0.08" }} />

        <div className="ve-wrap">
          {/* Logo */}
          <Link href="/" className="ve-logo">
            <div className="ve-logo-ring">🌀</div>
            <span className="ve-logo-text">EmoSoul</span>
          </Link>

          <Card className="ve-card">
            <CardHeader className="ve-card-header">
              <CardTitle className="ve-card-title">
                {verified ? "Email verified!" : "Verify your email"}
              </CardTitle>
              <CardDescription className="ve-card-desc">
                {verified
                  ? "Your account is now active. Redirecting you to login..."
                  : "Enter the 6-digit code we sent to your inbox."}
              </CardDescription>
            </CardHeader>

            <CardContent className="ve-card-content">
              {verified ? (
                /* ── Success state ── */
                <div className="ve-success">
                  <div className="ve-success-icon">
                    <CheckCircle2 size={30} color="#34d399" />
                  </div>
                  <p className="ve-success-title">You're all set! 🎉</p>
                  <p className="ve-success-desc">
                    Your email has been verified successfully. Taking you to login in a moment...
                  </p>
                  <div className="ve-redirect-bar-wrap">
                    <div className="ve-redirect-bar" />
                  </div>
                  <Button
                    className="ve-btn"
                    onClick={() => router.push("/login")}
                  >
                    <ShieldCheck size={15} />
                    Go to login now
                  </Button>
                </div>
              ) : (
                /* ── Form state ── */
                <>
                  {/* Hint */}
                  <div className="ve-hint">
                    <span style={{ fontSize: 15, marginTop: 1 }}>📬</span>
                    <span className="ve-hint-text">
                      We sent a 6-digit verification code to{" "}
                      {email
                        ? <strong style={{ color: "rgba(255,255,255,0.65)" }}>{email}</strong>
                        : "your email address"
                      }. It expires shortly — enter it below.
                    </span>
                  </div>

                  <form onSubmit={onSubmit}>
                    {/* Email field — shown only if not pre-filled */}
                    {!searchParams.get("email") && (
                      <div className="space-y-2" style={{ marginBottom: 20 }}>
                        <Label htmlFor="email" className="ve-label">Email address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="ve-input"
                        />
                      </div>
                    )}

                    {/* OTP input */}
                    <div style={{ marginBottom: 6 }}>
                      <Label className="ve-label" style={{ display: "block", marginBottom: 14, textAlign: "center" }}>
                        Verification code
                      </Label>
                      <div className="ve-otp-wrap" onPaste={handleOtpPaste}>
                        {[0, 1, 2].map((i) => (
                          <input
                            key={i}
                            ref={(el) => { inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={code[i]}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            className={`ve-otp-box ${code[i] ? "filled" : ""} ${error ? "error-box" : ""}`}
                          />
                        ))}
                        <span className="ve-otp-sep">·</span>
                        {[3, 4, 5].map((i) => (
                          <input
                            key={i}
                            ref={(el) => { inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={code[i]}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            className={`ve-otp-box ${code[i] ? "filled" : ""} ${error ? "error-box" : ""}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="ve-error" style={{ marginBottom: 16 }}>
                        <span style={{ marginTop: 1 }}>⚠</span>
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={loading || fullCode.length < 6 || !email}
                      className="ve-btn"
                      style={{ marginTop: 8 }}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={15} style={{ animation: "veSpin 0.8s linear infinite" }} />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={15} />
                          Verify email
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Resend */}
                  <div className="ve-resend-row">
                    <span>Didn't receive it?</span>
                    <button
                      className="ve-resend-btn"
                      onClick={handleResend}
                      disabled={resending || countdown > 0}
                      type="button"
                    >
                      {resending ? (
                        <><Loader2 size={12} style={{ animation: "veSpin 0.8s linear infinite" }} /> Resending...</>
                      ) : countdown > 0 ? (
                        `Resend in ${countdown}s`
                      ) : (
                        <><RefreshCw size={12} /> Resend code</>
                      )}
                    </button>
                  </div>
                  {resendSuccess && (
                    <p style={{ textAlign: "center", fontSize: 12, color: "#34d399", marginTop: 6 }}>
                      ✓ A new code was sent to your inbox
                    </p>
                  )}

                  <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                    Wrong account?{" "}
                    <Link href="/signup" className="ve-link">Sign up again</Link>
                  </p>
                </>
              )}
            </CardContent>

            {/* Mood strip */}
            <div className="ve-mood-strip">
              <div className="ve-mood-dot" style={{ background: "#a78bfa" }} />
              <div className="ve-mood-dot" style={{ background: "#60a5fa" }} />
              <div className="ve-mood-dot" style={{ background: "#34d399" }} />
              <span className="ve-mood-hint">
                {verified ? "Welcome to EmoSoul" : "One step away from EmoSoul"}
              </span>
            </div>
          </Card>

          <Link href="/login" className="ve-back">
            <ArrowLeft size={14} />
            Back to login
          </Link>
        </div>
      </div>
    </>
  );
}