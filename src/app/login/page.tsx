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
import { Loader2, LogIn, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post("/api/auth/login", { email, password });
      await axios.get("/api/auth/me");
      router.push("/");
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

        .login-root {
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

        .lora { font-family: 'Lora', serif; }

        /* Orbs */
        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.16;
          pointer-events: none;
          z-index: 0;
        }
        .orb-1 {
          width: 560px; height: 560px;
          top: -180px; left: -160px;
          background: #1a1a3e;
        }
        .orb-2 {
          width: 420px; height: 420px;
          bottom: -100px; right: -120px;
          background: #111130;
        }
        .orb-3 {
          width: 300px; height: 300px;
          top: 40%; left: 55%;
          background: #1a1a3e;
          opacity: 0.08;
        }

        /* Floating grid dots */
        .grid-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image:
            radial-gradient(circle, rgba(167,139,250,0.07) 1px, transparent 1px);
          background-size: 36px 36px;
          pointer-events: none;
        }

        /* Card wrapper */
        .card-wrap {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          animation: fadeUp 0.65s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Logo */
        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 28px;
          text-decoration: none;
        }
        .logo-ring {
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(167,139,250,0.12);
          border: 1.5px solid rgba(167,139,250,0.4);
          font-size: 16px;
          animation: spinSlow 14s linear infinite;
        }
        @keyframes spinSlow { to { transform: rotate(360deg); } }

        .logo-text {
          font-family: 'Lora', serif;
          font-size: 22px;
          font-weight: 700;
          color: #a78bfa;
          letter-spacing: 0.01em;
        }

        /* Shadcn Card override */
        .emo-card {
          background: rgba(255,255,255,0.035) !important;
          border: 1px solid rgba(255,255,255,0.09) !important;
          border-radius: 22px !important;
          backdrop-filter: blur(20px) !important;
          box-shadow: 0 24px 60px rgba(0,0,0,0.45) !important;
          overflow: hidden;
        }

        .emo-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(167,139,250,0.4), transparent);
          pointer-events: none;
        }

        /* Card header */
        .emo-card-header {
          padding: 32px 32px 16px !important;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .emo-card-title {
          font-family: 'Lora', serif !important;
          font-size: 1.65rem !important;
          font-weight: 700 !important;
          color: white !important;
          letter-spacing: -0.01em;
        }

        .emo-card-desc {
          color: rgba(255,255,255,0.42) !important;
          font-size: 14px !important;
          margin-top: 5px !important;
          line-height: 1.6;
        }

        /* Card content */
        .emo-card-content {
          padding: 28px 32px 32px !important;
        }

        /* Label */
        .emo-label {
          color: rgba(255,255,255,0.65) !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          letter-spacing: 0.01em;
        }

        /* Input */
        .emo-input {
          background: rgba(255,255,255,0.055) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 10px !important;
          color: white !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 14px !important;
          height: 44px !important;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
        }
        .emo-input::placeholder {
          color: rgba(255,255,255,0.2) !important;
        }
        .emo-input:focus {
          border-color: rgba(167,139,250,0.55) !important;
          background: rgba(167,139,250,0.07) !important;
          box-shadow: 0 0 0 3px rgba(167,139,250,0.12) !important;
          outline: none !important;
        }

        /* Submit btn */
        .emo-btn {
          width: 100%;
          height: 46px;
          border-radius: 12px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          font-family: 'DM Sans', sans-serif !important;
          background: #a78bfa !important;
          color: #0a0a14 !important;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s !important;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }
        .emo-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(167,139,250,0.35) !important;
        }
        .emo-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .emo-btn:disabled {
          opacity: 0.55 !important;
          cursor: not-allowed;
        }

        /* Error */
        .emo-error {
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

        /* Divider */
        .emo-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0 0;
        }
        .emo-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }
        .emo-divider-text {
          font-size: 12px;
          color: rgba(255,255,255,0.25);
        }

        /* Footer link */
        .emo-footer {
          text-align: center;
          margin-top: 18px;
          font-size: 13px;
          color: rgba(255,255,255,0.35);
        }
        .emo-link {
          color: #a78bfa;
          text-decoration: none;
          font-weight: 500;
          transition: opacity 0.2s;
        }
        .emo-link:hover { opacity: 0.75; text-decoration: underline; }

        /* Mood hint strip at bottom of card */
        .mood-strip {
          display: flex;
          gap: 6px;
          padding: 14px 32px;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(167,139,250,0.04);
        }
        .mood-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          animation: pulseDot 2.4s ease-in-out infinite;
        }
        @keyframes pulseDot { 0%,100%{opacity:.3} 50%{opacity:1} }
        .mood-dot:nth-child(2) { animation-delay: 0.4s; }
        .mood-dot:nth-child(3) { animation-delay: 0.8s; }
        .mood-hint-text {
          font-size: 11px;
          color: rgba(255,255,255,0.28);
          letter-spacing: 0.02em;
          margin-left: 4px;
        }
      `}</style>

      <div className="login-root">
        {/* Background layers */}
        <div className="grid-bg" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="card-wrap">
          {/* Logo */}
          <Link href="/" className="logo">
            <div className="logo-ring">🌀</div>
            <span className="logo-text">EmoSoul</span>
          </Link>

          {/* Card */}
          <Card className="emo-card" style={{ position: "relative" }}>
            <CardHeader className="emo-card-header">
              <CardTitle className="emo-card-title">Welcome back</CardTitle>
              <CardDescription className="emo-card-desc">
                Login to continue your mood journey.
              </CardDescription>
            </CardHeader>

            <CardContent className="emo-card-content">
              <form className="space-y-5" onSubmit={onSubmit}>
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="emo-label">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="emo-input"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Label htmlFor="password" className="emo-label">
                      Password
                    </Label>
                    <Link href="/forget-password" className="emo-link" style={{ fontSize: 12 }}>
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="emo-input"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="emo-error">
                    <span style={{ marginTop: 1 }}>⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <Button type="submit" disabled={loading} className="emo-btn" style={{ marginTop: 4 }}>
                  {loading ? (
                    <>
                      <Loader2 size={15} style={{ animation: "spinSlow 0.8s linear infinite" }} />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn size={15} />
                      Login to EmoSoul
                    </>
                  )}
                </Button>
              </form>

              {/* Divider + signup */}
              <div className="emo-divider">
                <div className="emo-divider-line" />
                <span className="emo-divider-text">or</span>
                <div className="emo-divider-line" />
              </div>

              <p className="emo-footer">
                New here?{" "}
                <Link href="/signup" className="emo-link">
                  Create a free account
                </Link>
              </p>
            </CardContent>

            {/* Mood strip */}
            <div className="mood-strip">
              <div className="mood-dot" style={{ background: "#a78bfa" }} />
              <div className="mood-dot" style={{ background: "#60a5fa" }} />
              <div className="mood-dot" style={{ background: "#34d399" }} />
              <span className="mood-hint-text">Your emotions are safe here</span>
            </div>
          </Card>

          {/* Terms note */}
          <p style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.6 }}>
            By continuing, you agree to our{" "}
            <Link href="/terms" className="emo-link" style={{ fontSize: 11 }}>Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="emo-link" style={{ fontSize: 11 }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </>
  );
}