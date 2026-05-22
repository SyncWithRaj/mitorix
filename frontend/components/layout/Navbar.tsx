"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Image from "next/image";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  if (pathname.startsWith("/codeflow")) return null;

  return (
    <nav
      className={`fixed left-0 right-0 z-50 transition-all duration-500 text-[#e5e5e5] px-6 py-3.5 flex items-center justify-between ${
        scrolled
          ? "top-0 mx-0 rounded-none border-t-0 border-x-0 glass-panel shadow-[0_8px_40px_rgba(0,0,0,0.6)] border-b border-[#ff6b00]/20"
          : "top-[15px] mx-[15px] rounded-2xl bg-[#000000]/30 backdrop-blur-xl border border-[rgba(255,255,255,0.05)] shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
      }`}
    >
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
            <span className="font-semibold text-xl tracking-tight bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#ff6b00] transition-all duration-300">
              RepoLens
            </span>
          </Link>
        )}

        <div className="hidden md:flex space-x-2">
          <Link
            href="/about"
            className="text-sm font-medium text-[#737373] hover:text-[#e5e5e5] px-3 py-1.5 rounded-md transition-all duration-300 relative group overflow-hidden"
          >
            <span className="relative z-10">About</span>
            <div className="absolute bottom-1 left-3 right-3 h-[2px] bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-x-50 group-hover:scale-x-100 rounded-full"></div>
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-[#737373] hover:text-[#e5e5e5] px-3 py-1.5 rounded-md transition-all duration-300 relative group overflow-hidden"
          >
            <span className="relative z-10">Contact Us</span>
            <div className="absolute bottom-1 left-3 right-3 h-[2px] bg-gradient-to-r from-[#ff8c00] to-[#ffa800] opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-x-50 group-hover:scale-x-100 rounded-full"></div>
          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <>
            <Link
              href="/dashboard"
              className="text-sm font-medium hover:text-white text-[#e5e5e5] hover:bg-[#0a0a0a] px-3 py-1.5 rounded-md transition-all duration-300"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-[#ff4500] hover:text-white hover:bg-[#ff4500] hover:border-[#ff4500] transition-all duration-300 active:scale-95 font-medium bg-[#0a0a0a] border border-[#1a1a1a] px-4 py-1.5 rounded-lg shadow-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="group relative text-sm font-medium text-white px-6 py-2 rounded-lg transition-all duration-300 active:scale-95 block overflow-hidden border border-[#ff6b00]/30 shadow-[0_0_20px_rgba(255,107,0,0.15)] hover:shadow-[0_0_30px_rgba(255,107,0,0.3)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] transition-opacity duration-300 group-hover:opacity-90"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
            <span className="relative z-10 flex items-center gap-2">Sign in</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
