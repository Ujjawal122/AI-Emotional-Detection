import { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl mood-float-slow" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl mood-float-fast" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl mood-float-slow" />

      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute left-1/6 top-1/4 h-2 w-2 rounded-full bg-slate-200 mood-ping" />
        <div className="absolute left-2/3 top-1/3 h-1.5 w-1.5 rounded-full bg-cyan-200 mood-ping delay-700" />
        <div className="absolute left-1/2 top-2/3 h-2 w-2 rounded-full bg-indigo-200 mood-ping delay-300" />
      </div>

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}

