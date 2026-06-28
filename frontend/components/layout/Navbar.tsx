"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, LogOut, Sparkles } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Image from "next/image";
import { motion } from "motion/react";
import { useSubscription } from "@/context/SubscriptionContext";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { tier } = useSubscription();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get("/auth/me");
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [pathname]); // Re-verify on navigation

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      setIsAuthenticated(false);
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Logout failed. Please try again.");
    }
  };

  const inRepoSpace = pathname.startsWith("/chat") || pathname.startsWith("/codeflow");
  const inRepoLabs = pathname.startsWith("/repolabs");

  if (pathname.startsWith("/codeflow") || pathname === "/login") return null;

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 transition-transform duration-500 ease-in-out ${isVisible ? "translate-y-0" : "-translate-y-full"}`}>
      <nav
        className={`pointer-events-auto transition-all duration-500 text-[#e5e5e5] px-6 py-3.5 flex items-center justify-between w-full max-w-7xl relative ${
          inRepoLabs
            ? "bg-[#000000] rounded-none border-b border-[#1a1a1a]"
            : "bg-white/[0.03] backdrop-blur-2xl rounded-b-[28px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_inset_0_-1px_1px_rgba(255,255,255,0.05),_0_15px_40px_rgba(0,0,0,0.6)] border border-t-0 border-white/10"
        }`}
      >
        {!inRepoLabs && (
          <>
            <svg className="absolute top-0 -left-4 w-4 h-4 text-white/[0.03] fill-current backdrop-blur-2xl" viewBox="0 0 16 16">
              <path d="M16 0L0 0C8.83656 0 16 7.16344 16 16Z" />
            </svg>
            <svg className="absolute top-0 -right-4 w-4 h-4 text-white/[0.03] fill-current backdrop-blur-2xl" viewBox="0 0 16 16">
              <path d="M0 0L16 0C7.16344 0 0 7.16344 0 16Z" />
            </svg>
          </>
        )}
      <div className="flex items-center space-x-6">
        {inRepoSpace ? (
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center justify-center p-2 rounded-lg bg-[#0a0a0a] hover:bg-[#1a1a1a] text-[#e5e5e5] hover:text-white transition-all duration-300 active:scale-95 border border-[#1a1a1a] hover:border-[#ff6b00]/30 shadow-sm"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="w-[1px] h-6 bg-[#1a1a1a]"></div>
            <span className="flex items-center space-x-2 text-white">
              <span className="font-bold text-xl tracking-tight">RepoLens</span>
            </span>
          </div>
        ) : (
          <Link href="/" className="flex items-center space-x-2 text-white group">
            <div className="relative rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] group-hover:border-[#ff6b00]/50 transition-all duration-300 shadow-inner group-hover:shadow-[0_0_15px_rgba(255,107,0,0.3)] flex items-center justify-center overflow-hidden w-8 h-8">
              <div className="absolute inset-0 bg-[#ff6b00] opacity-0 group-hover:opacity-20 blur-md rounded-lg transition-opacity duration-300 z-0"></div>
              <Image
                src="/logo.png"
                alt="RepoLens"
                width={32}
                height={32}
                className="relative z-10 object-cover w-full h-full"
                unoptimized
                priority
              />
            </div>
            <span className="font-semibold text-xl tracking-tight bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#ff6b00] transition-all duration-300 select-none">
              RepoLens
            </span>
          </Link>
        )}

        <div className="hidden md:flex space-x-2 relative">
          {[
            { name: "Home", path: "/" },
            ...(isAuthenticated ? [{ name: "Dashboard", path: "/dashboard" }] : []),
            { name: "About", path: "/about" },
            { name: "Contact Us", path: "/contact" },
          ].map((tab) => (
            <Link
              key={tab.path}
              href={tab.path}
              className={`relative px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                pathname === tab.path ? "text-white" : "text-[#a3a3a3] hover:text-[#e5e5e5]"
              }`}
            >
              {pathname === tab.path && (
                <motion.div
                  layoutId="activeNavbarTab"
                  className="absolute inset-0 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-0"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{tab.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <div className="flex items-center space-x-4">
            <div className={`hidden sm:flex items-center justify-center gap-1.5 px-4 h-10 rounded-full border text-xs font-black uppercase tracking-widest relative overflow-hidden group transition-all duration-300 select-none ${
              tier === 'PRO' ? 'bg-gradient-to-r from-[#ffb000]/10 to-[#ff8c00]/10 border-[#ffb000]/40 text-[#ffb000] shadow-[0_0_20px_rgba(255,176,0,0.25)] hover:shadow-[0_0_30px_rgba(255,176,0,0.4)]' :
              tier === 'BASIC' ? 'bg-gradient-to-r from-[#ff6b00]/10 to-[#ff8c00]/10 border-[#ff6b00]/40 text-[#ff6b00] shadow-[0_0_20px_rgba(255,107,0,0.15)] hover:shadow-[0_0_30px_rgba(255,107,0,0.3)]' :
              'bg-gradient-to-r from-white/5 to-white/5 border-white/20 text-[#c9d1d9] shadow-[0_0_15px_rgba(255,255,255,0.05)]'
            }`}>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
              <Sparkles size={13} className={tier === 'PRO' ? 'animate-pulse text-[#ffb000]' : ''} /> 
              <span className={tier === 'PRO' ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#ffb000] to-[#ffd000]' : ''}>{tier} PLAN</span>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="w-10 h-10 rounded-xl bg-[#ff6b00] border border-[#ff8c00]/30 text-black hover:shadow-[0_0_25px_rgba(255,107,0,0.5)] shadow-[0_0_15px_rgba(255,107,0,0.3)] overflow-hidden group flex items-center justify-center transition-all duration-300 relative"
            >
              <div className="absolute inset-0 bg-white origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] z-0"></div>
              <LogOut className="relative z-10 w-4 h-4 group-hover:text-black transition-colors duration-500" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="relative overflow-hidden text-sm font-bold text-white bg-[#ff6b00] px-6 py-2.5 rounded-xl transition-all duration-300 group shadow-[0_0_15px_rgba(255,107,0,0.4)] border border-[#ff8c00]/30 hover:shadow-[0_0_25px_rgba(255,107,0,0.6)] block"
          >
            <div className="absolute inset-0 bg-white origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] z-0"></div>
            <span className="relative z-10 flex items-center gap-2 group-hover:text-black transition-colors duration-500">Sign in</span>
          </Link>
        )}
      </div>
      </nav>
    </div>
    </>
  );
}
