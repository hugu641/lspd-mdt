"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  AlertTriangle,
  ShieldCheck,
  Key,
  Loader2,
} from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [discordConfig, setDiscordConfig] = useState<any>(null);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) {
      setErrorMsg(decodeURIComponent(err));
    }

    // Check if Discord settings are configured
    fetch("/api/discord/settings")
      .then((res) => res.json())
      .then((data) => setDiscordConfig(data))
      .catch(() => {});
  }, [searchParams]);

  const handleDiscordLogin = () => {
    setLoading(true);
    window.location.href = "/api/auth/discord/login";
  };

  const handleDemoBypass = async () => {
    setLoading(true);
    try {
      localStorage.setItem("lspd_bypass_auth", "true");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080f] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Holographic Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-96 bg-purple-900/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#8b5cf6 1px, transparent 1px), linear-gradient(90deg, #8b5cf6 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Main Terminal Gate Card */}
        <div className="rounded-3xl bg-gradient-to-b from-[#0f1228] via-[#0a0c1a] to-[#070812] border border-purple-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(139,92,246,0.15)] relative backdrop-blur-xl space-y-6">
          {/* Header Seal & Title */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-600 p-[1.5px] shadow-[0_0_30px_rgba(168,85,247,0.35)] flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0c1a] rounded-[15px] flex items-center justify-center">
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-purple-400">
                <span>RÉSEAU INTRANET SÉCURISÉ</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono">DÉFENSE ALPHA</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                LSPD TERMINAL MDT
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Système d&apos;Information Tactique & Données Judiciaires du Los Santos Police Department
              </p>
            </div>
          </div>

          {/* Access Rule Banner */}
          <div className="p-3.5 rounded-xl bg-[#090b16] border border-[#1b1f3c] flex items-start gap-3 text-left">
            <Lock className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="text-[11px] text-slate-300 leading-relaxed">
              <strong>Accès Restreint :</strong> La connexion requiert un compte Discord vérifié possédant le rôle <strong className="text-purple-300">LSPD / Police</strong> ou un grade officiel sur le serveur de la faction.
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-left space-y-2 animate-fade-in shadow-inner">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Accès Refusé par le Système</span>
              </div>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                {errorMsg}
              </p>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-rose-900/40">
                💡 Contactez un responsable de brigade ou l&apos;État-Major pour obtenir votre rôle sur Discord.
              </div>
            </div>
          )}

          {/* Discord Login Button */}
          <div className="space-y-3">
            <button
              onClick={handleDiscordLogin}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#5865F2] via-[#4752C4] to-[#7c3aed] hover:from-[#6975f5] hover:to-[#8b5cf6] text-white font-black text-sm shadow-[0_0_25px_rgba(88,101,242,0.4)] border border-indigo-400/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {/* Discord SVG Logo */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span>{loading ? "Connexion en cours..." : "Se connecter avec Discord"}</span>
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Authentification OAuth2 Officielle Chiffrée</span>
            </div>
          </div>

          {/* Admin / Setup Info if not configured yet */}
          {discordConfig && !discordConfig.clientId && (
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-left space-y-2">
              <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-400" />
                <span>Configuration Requise pour l&apos;Administrateur :</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Le Client ID Discord OAuth2 n&apos;est pas encore renseigné dans l&apos;administration.
              </p>
              <button
                onClick={handleDemoBypass}
                className="w-full py-1.5 rounded-lg bg-[#141838] hover:bg-[#1d2352] text-xs font-bold text-purple-300 border border-purple-500/40 transition-colors"
              >
                Accès Mode Configuration / Démo &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Footer Security Badges */}
        <div className="text-center text-[10px] text-slate-500 space-y-1">
          <div>LOS SANTOS POLICE DEPARTMENT • DIVISION DES SYSTÈMES TACTIQUES</div>
          <div>Toute tentative d&apos;intrusion non autorisée est enregistrée et transmise au Parquet.</div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07080f] text-slate-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
