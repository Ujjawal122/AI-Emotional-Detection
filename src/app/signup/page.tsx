"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Loader2, UserPlus } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post("/api/auth/signup", { username, email, password });
      router.push("/verify-email");
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

        .signup-root {
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

        /* Orbs */
        .su-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.16;
          pointer-events: none;
          z-index: 0;
        }

        /* Grid dots */
        .su-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image: radial-gradient(circle, rgba(167,139,250,0.07) 1px, transparent 1px);
          background-size: 36px 36px;
          pointer-events: none;
        }

        /* Card wrapper */
        .su-wrap {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 460px;
          animation: suFadeUp 0.65s ease both;
        }
        @keyframes suFadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Logo */
        .su-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 28px;
          text-decoration: none;
        }
        .su-logo-ring {
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(167,139,250,0.12);
          border: 1.5px solid rgba(167,139,250,0.4);
          font-size: 16px;
          animation: suSpin 14s linear infinite;
        }
        @keyframes suSpin { to { transform: rotate(360deg); } }
        .su-logo-text {
          font-family: 'Lora', serif;
          font-size: 22px;
          font-weight: 700;
          color: #a78bfa;
        }

        /* Card */
        .su-card {
          background: rgba(255,255,255,0.035) !important;
          border: 1px solid rgba(255,255,255,0.09) !important;
          border-radius: 22px !important;
          backdrop-filter: blur(20px) !important;
          box-shadow: 0 24px 60px rgba(0,0,0,0.45) !important;
          overflow: hidden;
          position: relative;
        }
        .su-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(167,139,250,0.4), transparent);
          pointer-events: none;
        }

        .su-card-header {
          padding: 32px 32px 16px !important;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .su-card-title {
          font-family: 'Lora', serif !important;
          font-size: 1.65rem !important;
          font-weight: 700 !important;
          color: white !important;
          letter-spacing: -0.01em;
        }
        .su-card-desc {
          color: rgba(255,255,255,0.42) !important;
          font-size: 14px !important;
          margin-top: 5px !important;
          line-height: 1.6;
        }
        .su-card-content {
          padding: 28px 32px 32px !important;
        }

        /* Label */
        .su-label {
          color: rgba(255,255,255,0.65) !important;
          font-size: 13px !important;
          font-weight: 500 !important;
        }

        /* Input */
        .su-input {
          background: rgba(255,255,255,0.055) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 10px !important;
          color: white !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 14px !important;
          height: 44px !important;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
        }
        .su-input::placeholder { color: rgba(255,255,255,0.2) !important; }
        .su-input:focus {
          border-color: rgba(167,139,250,0.55) !important;
          background: rgba(167,139,250,0.07) !important;
          box-shadow: 0 0 0 3px rgba(167,139,250,0.12) !important;
          outline: none !important;
        }

        /* Password strength bar */
        .su-strength-wrap { margin-top: 8px; display: flex; gap: 5px; }
        .su-strength-seg {
          flex: 1; height: 3px; border-radius: 2px;
          transition: background 0.4s ease;
        }
        .su-strength-label {
          font-size: 11px;
          margin-top: 4px;
          transition: color 0.4s ease;
        }

        /* Submit btn */
        .su-btn {
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
        .su-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(167,139,250,0.35) !important;
        }
        .su-btn:disabled { opacity: 0.55 !important; cursor: not-allowed; }

        /* Error */
        .su-error {
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

        /* Perks list */
        .su-perks {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 22px;
          padding: 16px;
          background: rgba(167,139,250,0.05);
          border: 1px solid rgba(167,139,250,0.12);
          border-radius: 12px;
        }
        .su-perk-item {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 13px;
          color: rgba(255,255,255,0.55);
        }
        .su-perk-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #a78bfa;
          flex-shrink: 0;
          opacity: 0.7;
        }

        /* Divider */
        .su-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 22px 0 0;
        }
        .su-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); }
        .su-divider-text { font-size: 12px; color: rgba(255,255,255,0.25); }

        .su-footer {
          text-align: center;
          margin-top: 18px;
          font-size: 13px;
          color: rgba(255,255,255,0.35);
        }
        .su-link {
          color: #a78bfa;
          text-decoration: none;
          font-weight: 500;
          transition: opacity 0.2s;
        }
        .su-link:hover { opacity: 0.75; text-decoration: underline; }

        /* Mood strip */
        .su-mood-strip {
          display: flex; gap: 6px; align-items: center;
          padding: 14px 32px;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(167,139,250,0.04);
        }
        .su-mood-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          animation: suPulse 2.4s ease-in-out infinite;
        }
        @keyframes suPulse { 0%,100%{opacity:.3} 50%{opacity:1} }
        .su-mood-dot:nth-child(2) { animation-delay: 0.4s; }
        .su-mood-dot:nth-child(3) { animation-delay: 0.8s; }
        .su-mood-hint {
          font-size: 11px;
          color: rgba(255,255,255,0.28);
          letter-spacing: 0.02em;
          margin-left: 4px;
        }
      `}</style>

      <div className="signup-root">
        {/* Background */}
        <div className="su-grid" />
        <div className="su-orb" style={{ width: 580, height: 580, top: -180, left: -160, background: "#1a1a3e" }} />
        <div className="su-orb" style={{ width: 440, height: 440, bottom: -100, right: -120, background: "#111130" }} />
        <div className="su-orb" style={{ width: 280, height: 280, top: "38%", left: "58%", background: "#1a1a3e", opacity: "0.08" }} />

        <div className="su-wrap">
          {/* Logo */}
          <Link href="/" className="su-logo">
            <div className="su-logo-ring">🌀</div>
            <span className="su-logo-text">EmoSoul</span>
          </Link>

          <Card className="su-card">
            <CardHeader className="su-card-header">
              <CardTitle className="su-card-title">Create account</CardTitle>
              <CardDescription className="su-card-desc">
                Start tracking your emotions and build healthier habits.
              </CardDescription>
            </CardHeader>

            <CardContent className="su-card-content">
              {/* Perks */}
              <div className="su-perks">
                {[
                  "AI that reads and responds to your emotions",
                  "Upload personal documents & memories",
                  "Adaptive UI that shifts with your mood",
                ].map((perk) => (
                  <div key={perk} className="su-perk-item">
                    <div className="su-perk-dot" />
                    {perk}
                  </div>
                ))}
              </div>

              <form className="space-y-5" onSubmit={onSubmit}>
                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="su-label">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="What should we call you?"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="su-input"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="su-label">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="su-input"
                  />
                </div>

                {/* Password + strength */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="su-label">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="su-input"
                  />
                  {password.length > 0 && (
                    <PasswordStrength password={password} />
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="su-error">
                    <span style={{ marginTop: 1 }}>⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <Button type="submit" disabled={loading} className="su-btn" style={{ marginTop: 4 }}>
                  {loading ? (
                    <>
                      <Loader2 size={15} style={{ animation: "suSpin 0.8s linear infinite" }} />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} />
                      Create my EmoSoul account
                    </>
                  )}
                </Button>
              </form>

              {/* Divider + login */}
              <div className="su-divider">
                <div className="su-divider-line" />
                <span className="su-divider-text">or</span>
                <div className="su-divider-line" />
              </div>

              <p className="su-footer">
                Already have an account?{" "}
                <Link href="/login" className="su-link">Login instead</Link>
              </p>
            </CardContent>

            {/* Mood strip */}
            <div className="su-mood-strip">
              <div className="su-mood-dot" style={{ background: "#a78bfa" }} />
              <div className="su-mood-dot" style={{ background: "#60a5fa" }} />
              <div className="su-mood-dot" style={{ background: "#34d399" }} />
              <span className="su-mood-hint">Your journey starts here</span>
            </div>
          </Card>

          {/* Terms */}
          <p style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.6 }}>
            By signing up, you agree to our{" "}
            <Link href="/terms" className="su-link" style={{ fontSize: 11 }}>Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="su-link" style={{ fontSize: 11 }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </>
  );
}

// ── Password strength indicator ──────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const getStrength = (p: string) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const score = getStrength(password);
  const levels = [
    { label: "Too short", color: "#f87171" },
    { label: "Weak", color: "#fb923c" },
    { label: "Fair", color: "#facc15" },
    { label: "Good", color: "#34d399" },
    { label: "Strong", color: "#a78bfa" },
  ];
  const current = levels[score];

  return (
    <div>
      <div className="su-strength-wrap">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="su-strength-seg"
            style={{
              background: i < score ? current.color : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>
      <p className="su-strength-label" style={{ color: current.color }}>
        {current.label}
      </p>
    </div>
  );
}