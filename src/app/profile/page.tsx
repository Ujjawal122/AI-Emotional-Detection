"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
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
  Edit3,
  FileText,
  FolderOpen,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";

interface UserProfile {
  _id: string;
  username: string;
  fullName?: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ProfileForm {
  username: string;
  fullName: string;
  phone: string;
  location: string;
  bio: string;
}

const emptyForm: ProfileForm = {
  username: "",
  fullName: "",
  phone: "",
  location: "",
  bio: "",
};

const formatDate = (date?: string) => {
  if (!date) return "Not available";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [stats, setStats] = useState({ moods: 0, notes: 0, files: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await axios.get<UserProfile>("/api/auth/me", { withCredentials: true });
        setUser(data);
        setForm({
          username: data.username ?? "",
          fullName: data.fullName ?? "",
          phone: data.phone ?? "",
          location: data.location ?? "",
          bio: data.bio ?? "",
        });
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      const [moodRes, noteRes, fileRes] = await Promise.allSettled([
        axios.get("/api/mood/history", { withCredentials: true }),
        axios.get("/api/notes", { withCredentials: true }),
        axios.get("/api/files", { withCredentials: true }),
      ]);

      setStats({
        moods: moodRes.status === "fulfilled" && Array.isArray(moodRes.value.data?.moods) ? moodRes.value.data.moods.length : 0,
        notes: noteRes.status === "fulfilled" && Array.isArray(noteRes.value.data?.notes) ? noteRes.value.data.notes.length : 0,
        files: fileRes.status === "fulfilled" && Array.isArray(fileRes.value.data?.files) ? fileRes.value.data.files.length : 0,
      });
    };

    loadStats();
  }, [user]);

  const displayName = user?.fullName || user?.username;
  const initials = displayName
    ? displayName.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const completeness = useMemo(() => {
    if (!user) return 0;
    const fields = [user.username, user.fullName, user.email, user.phone, user.location, user.bio];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [user]);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
    } catch {
      // Continue with local navigation even if the cookie is already gone.
    }
    router.push("/login");
  };

  const handleCancel = () => {
    if (!user) return;
    setForm({
      username: user.username ?? "",
      fullName: user.fullName ?? "",
      phone: user.phone ?? "",
      location: user.location ?? "",
      bio: user.bio ?? "",
    });
    setEditing(false);
    setError("");
    setMessage("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const { data } = await axios.patch<UserProfile>("/api/auth/me", form, { withCredentials: true });
      setUser(data);
      setForm({
        username: data.username ?? "",
        fullName: data.fullName ?? "",
        phone: data.phone ?? "",
        location: data.location ?? "",
        bio: data.bio ?? "",
      });
      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? err.response?.data?.error ?? "Failed to update profile."
          : "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loader">
        <StyleBlock />
        <Loader2 size={24} className="profile-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <StyleBlock />
      <div className="profile-root">
        <div className="profile-grid-bg" />
        <div className="profile-orb profile-orb-one" />
        <div className="profile-orb profile-orb-two" />

        <nav className="profile-nav">
          <div className="profile-nav-inner">
            <div className="profile-nav-left">
              <button className="profile-back" onClick={() => router.push("/dashboard")}>
                <ArrowLeft size={14} /> Dashboard
              </button>
              <Link href="/" className="profile-logo">
                <span className="profile-logo-ring">E</span>
                <span className="profile-logo-text">EmoSoul</span>
              </Link>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="profile-user-btn">
                  <Avatar className="profile-menu-avatar">
                    <AvatarFallback className="profile-avatar-fallback">{initials}</AvatarFallback>
                  </Avatar>
                  <span>{displayName ?? user.email}</span>
                  <ChevronDown size={13} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="profile-dropdown">
                <DropdownMenuLabel className="profile-dropdown-label">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator className="profile-separator" />
                <DropdownMenuItem onClick={() => router.push("/dashboard")} className="profile-dropdown-item">
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator className="profile-separator" />
                <DropdownMenuItem onClick={handleLogout} className="profile-dropdown-danger">
                  <LogOut size={13} /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        <main className="profile-main">
          <p className="profile-kicker">Profile</p>
          <h1 className="profile-title">Your account details</h1>
          <p className="profile-subtitle">
            Keep your personal information current for a more useful emotional journal.
          </p>

          <section className="profile-hero">
            <div className="profile-panel profile-overview">
              <div className="profile-avatar-wrap">
                <Avatar className="profile-big-avatar">
                  <AvatarFallback className="profile-big-fallback">{initials}</AvatarFallback>
                </Avatar>
              </div>
              <div className="profile-overview-copy">
                <span className="profile-verified">
                  <ShieldCheck size={14} />
                  {user.isVerified ? "Verified account" : "Email not verified"}
                </span>
                <h2>{displayName || "Add your name"}</h2>
                <p>@{user.username}</p>
                <div className="profile-actions">
                  {editing ? (
                    <>
                      <button className="profile-primary-btn" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 size={14} className="profile-spin" /> : <Save size={14} />}
                        Save changes
                      </button>
                      <button className="profile-secondary-btn" onClick={handleCancel} disabled={saving}>
                        <X size={14} /> Cancel
                      </button>
                    </>
                  ) : (
                    <button className="profile-primary-btn" onClick={() => setEditing(true)}>
                      <Edit3 size={14} /> Edit profile
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-panel profile-strength">
              <div className="profile-strength-head">
                <span>Profile strength</span>
                <strong>{completeness}%</strong>
              </div>
              <div className="profile-progress">
                <div style={{ width: `${completeness}%` }} />
              </div>
              <p>Add your name, phone, location, and bio to complete your profile.</p>
            </div>
          </section>

          <section className="profile-content">
            <div className="profile-panel profile-section">
              <h2>Personal information</h2>
              <div className="profile-form-grid">
                <ProfileField label="Username" icon={<UserRound size={15} />} editing={editing} value={user.username}>
                  <input className="profile-input" value={form.username} maxLength={30} onChange={(e) => setForm((v) => ({ ...v, username: e.target.value }))} />
                </ProfileField>
                <ProfileField label="Full name" icon={<UserRound size={15} />} editing={editing} value={user.fullName} empty="Add your full name">
                  <input className="profile-input" value={form.fullName} maxLength={80} onChange={(e) => setForm((v) => ({ ...v, fullName: e.target.value }))} />
                </ProfileField>
                <ProfileField label="Email address" icon={<Mail size={15} />} editing={false} value={user.email} />
                <ProfileField label="Phone" icon={<Phone size={15} />} editing={editing} value={user.phone} empty="Add a phone number">
                  <input className="profile-input" value={form.phone} maxLength={25} onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))} />
                </ProfileField>
                <ProfileField label="Location" icon={<MapPin size={15} />} editing={editing} value={user.location} empty="Add your location">
                  <input className="profile-input" value={form.location} maxLength={80} onChange={(e) => setForm((v) => ({ ...v, location: e.target.value }))} />
                </ProfileField>
                <ProfileField label="Member since" icon={<CalendarDays size={15} />} editing={false} value={formatDate(user.createdAt)} />
                <ProfileField label="Bio" editing={editing} value={user.bio} empty="Add a short bio" full>
                  <div>
                    <textarea className="profile-textarea" value={form.bio} maxLength={240} onChange={(e) => setForm((v) => ({ ...v, bio: e.target.value }))} />
                    <p className="profile-char-count">{form.bio.length}/240</p>
                  </div>
                </ProfileField>
              </div>

              {message && <div className="profile-message"><CheckCircle2 size={15} />{message}</div>}
              {error && <div className="profile-error"><X size={15} />{error}</div>}
            </div>

            <aside className="profile-panel profile-section">
              <h2>Your activity</h2>
              <div className="profile-stat-list">
                <ActivityStat icon={<TrendingUp size={17} />} color="#34d399" label="Mood entries" value={stats.moods} />
                <ActivityStat icon={<FileText size={17} />} color="#a78bfa" label="Notes" value={stats.notes} />
                <ActivityStat icon={<FolderOpen size={17} />} color="#60a5fa" label="Files" value={stats.files} />
              </div>
              <div className="profile-divider" />
              <DetailLine label="Account ID" value={user._id} />
              <DetailLine label="Last updated" value={formatDate(user.updatedAt)} />
              <DetailLine label="Email status" value={user.isVerified ? "Verified" : "Not verified"} />
            </aside>
          </section>
        </main>
      </div>
    </>
  );
}

function ProfileField({
  label,
  value,
  empty = "Not added",
  icon,
  editing,
  children,
  full = false,
}: {
  label: string;
  value?: string;
  empty?: string;
  icon?: React.ReactNode;
  editing: boolean;
  children?: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "profile-field profile-field-full" : "profile-field"}>
      <label>{label}</label>
      {editing && children ? (
        children
      ) : (
        <div className={value ? "profile-readonly" : "profile-readonly profile-muted"}>
          {icon}
          <span>{value || empty}</span>
        </div>
      )}
    </div>
  );
}

function ActivityStat({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: number }) {
  return (
    <div className="profile-stat">
      <div className="profile-stat-icon" style={{ color, background: `${color}1a`, borderColor: `${color}40` }}>
        {icon}
      </div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="profile-detail">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

function StyleBlock() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
      *,*::before,*::after{box-sizing:border-box} body{margin:0;background:#09090f}
      .profile-root{font-family:'DM Sans',sans-serif;min-height:100vh;background:linear-gradient(135deg,#09090f 0%,#111122 48%,#09090f 100%);color:white;position:relative;overflow-x:hidden}
      .profile-grid-bg{position:fixed;inset:0;z-index:0;background-image:radial-gradient(circle,rgba(167,139,250,.055) 1px,transparent 1px);background-size:36px 36px;pointer-events:none}
      .profile-orb{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0}.profile-orb-one{width:460px;height:460px;top:-150px;left:-130px;background:#a78bfa;opacity:.1}.profile-orb-two{width:360px;height:360px;right:-120px;bottom:6%;background:#34d399;opacity:.07}
      .profile-nav{position:sticky;top:0;z-index:50;background:rgba(9,9,15,.72);backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,.07)}.profile-nav-inner{max-width:1100px;margin:0 auto;padding:0 24px;height:58px;display:flex;align-items:center;justify-content:space-between}.profile-nav-left{display:flex;align-items:center;gap:16px}
      .profile-back{display:flex;align-items:center;gap:6px;font-size:13px;color:rgba(255,255,255,.45);background:none;border:0;font-family:'DM Sans',sans-serif;cursor:pointer}.profile-back:hover{color:#a78bfa}.profile-logo{display:flex;align-items:center;gap:10px;text-decoration:none}.profile-logo-ring{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(167,139,250,.12);border:1.5px solid rgba(167,139,250,.4);color:#a78bfa;font-weight:800}.profile-logo-text{font-family:'Lora',serif;font-size:19px;font-weight:700;color:#a78bfa}
      .profile-user-btn{display:flex;align-items:center;gap:8px;padding:6px 12px 6px 6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:999px;cursor:pointer;color:rgba(255,255,255,.8);font-size:13px}.profile-user-btn span{max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.profile-user-btn:hover{background:rgba(255,255,255,.09)}.profile-menu-avatar{width:28px;height:28px}.profile-avatar-fallback{background:rgba(167,139,250,.2);color:#a78bfa;font-size:11px;font-weight:700}.profile-dropdown{background:#111120!important;border:1px solid rgba(255,255,255,.1)!important;color:white!important;min-width:180px}.profile-dropdown-label{color:rgba(255,255,255,.4);font-size:11px;font-weight:400}.profile-separator{background:rgba(255,255,255,.08)}.profile-dropdown-item{cursor:pointer;font-size:13px}.profile-dropdown-danger{cursor:pointer;color:#f87171;font-size:13px;display:flex;align-items:center;gap:7px}
      .profile-main{position:relative;z-index:10;max-width:1100px;margin:0 auto;padding:36px 24px 80px;animation:profileFadeUp .6s ease both}@keyframes profileFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.profile-kicker{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.18em;color:#a78bfa;margin:0 0 6px}.profile-title{font-family:'Lora',serif;font-size:clamp(1.6rem,4vw,2.35rem);font-weight:700;margin:0 0 6px}.profile-subtitle{color:rgba(255,255,255,.38);font-size:14px;margin:0 0 26px}
      .profile-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:18px;margin-bottom:18px}.profile-panel{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:18px;backdrop-filter:blur(20px);box-shadow:0 20px 55px rgba(0,0,0,.28);position:relative;overflow:hidden}.profile-panel::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(167,139,250,.35),transparent)}.profile-overview{padding:26px;display:flex;gap:20px;align-items:center}.profile-avatar-wrap{width:92px;height:92px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(167,139,250,.12);border:1px solid rgba(167,139,250,.34);flex-shrink:0}.profile-big-avatar{width:74px;height:74px}.profile-big-fallback{background:rgba(167,139,250,.18);color:#c4b5fd;font-size:24px;font-weight:800}.profile-overview-copy{min-width:0;flex:1}.profile-verified{display:inline-flex;align-items:center;gap:7px;padding:6px 11px;border-radius:999px;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.24);color:#34d399;font-size:12px;font-weight:600}.profile-overview h2{font-family:'Lora',serif;font-size:clamp(1.35rem,3vw,1.85rem);font-weight:700;margin:13px 0 5px;overflow-wrap:anywhere}.profile-overview p{font-size:14px;color:rgba(255,255,255,.38);margin:0;overflow-wrap:anywhere}.profile-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
      .profile-primary-btn,.profile-secondary-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 16px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:transform .2s}.profile-primary-btn{background:#a78bfa;color:#0a0a14;border:1px solid rgba(167,139,250,.45)}.profile-secondary-btn{background:rgba(255,255,255,.05);color:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.11)}.profile-primary-btn:hover,.profile-secondary-btn:hover{transform:translateY(-1px)}.profile-primary-btn:disabled{opacity:.55;cursor:not-allowed;transform:none}.profile-strength{padding:22px;display:flex;flex-direction:column;justify-content:center}.profile-strength-head{display:flex;justify-content:space-between;align-items:center;gap:12px;font-family:'Lora',serif;font-size:1.15rem;font-weight:700}.profile-strength-head strong{font-family:'DM Sans',sans-serif;color:#34d399;font-size:18px}.profile-progress{height:8px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin:14px 0 10px}.profile-progress div{height:100%;border-radius:999px;background:linear-gradient(90deg,#a78bfa,#34d399);transition:width .3s}.profile-strength p{font-size:13px;color:rgba(255,255,255,.36);line-height:1.6;margin:0}
      .profile-content{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:18px;align-items:start}.profile-section{padding:22px}.profile-section h2{font-family:'Lora',serif;font-size:1.15rem;font-weight:700;margin:0 0 16px}.profile-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.profile-field-full{grid-column:1/-1}.profile-field label,.profile-detail span{display:block;color:rgba(255,255,255,.38);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px}.profile-input,.profile-textarea{width:100%;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.045);color:white;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .2s,box-shadow .2s,background .2s}.profile-input{height:42px;padding:0 13px}.profile-textarea{min-height:112px;padding:13px;resize:vertical;line-height:1.6}.profile-input:focus,.profile-textarea:focus{border-color:rgba(167,139,250,.52);background:rgba(167,139,250,.06);box-shadow:0 0 0 3px rgba(167,139,250,.1)}.profile-readonly{min-height:42px;display:flex;align-items:center;gap:9px;padding:11px 13px;border-radius:8px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.76);font-size:14px;line-height:1.6;overflow-wrap:anywhere}.profile-muted{color:rgba(255,255,255,.3)}.profile-char-count{text-align:right;margin:6px 0 0;color:rgba(255,255,255,.28);font-size:11px}
      .profile-message,.profile-error{display:flex;align-items:flex-start;gap:8px;margin-top:16px;border-radius:8px;padding:11px 13px;font-size:13px;line-height:1.5}.profile-message{background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.24);color:#86efac}.profile-error{background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.25);color:#fca5a5}.profile-stat-list{display:grid;gap:10px}.profile-stat{display:flex;align-items:center;gap:12px;padding:13px;border-radius:12px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08)}.profile-stat-icon{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid}.profile-stat strong{display:block;font-size:18px;color:white}.profile-stat span{font-size:12px;color:rgba(255,255,255,.36)}.profile-divider{height:1px;background:rgba(255,255,255,.08);margin:18px 0}.profile-detail{margin-bottom:12px}.profile-detail p{color:rgba(255,255,255,.62);font-size:13px;line-height:1.5;overflow-wrap:anywhere;margin:0}.profile-loader{min-height:100vh;background:#09090f;display:flex;align-items:center;justify-content:center}.profile-spin{animation:profileSpin .8s linear infinite;color:#a78bfa}@keyframes profileSpin{to{transform:rotate(360deg)}}
      @media(max-width:850px){.profile-hero,.profile-content{grid-template-columns:1fr}.profile-overview{align-items:flex-start}}@media(max-width:560px){.profile-nav-inner{padding:0 16px}.profile-main{padding:28px 16px 64px}.profile-overview{flex-direction:column;padding:22px}.profile-form-grid{grid-template-columns:1fr}.profile-user-btn span{display:none}}
    `}</style>
  );
}
