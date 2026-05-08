import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full bg-[#0d1117] border-t border-[#30363d] pt-16 pb-8 px-6 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-[#58a6ff]/5 to-transparent blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand & Intro */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center space-x-2 text-white group">
              <div className="relative rounded-lg bg-[#21262d] border border-[#30363d] group-hover:border-[#58a6ff]/50 transition-colors flex items-center justify-center overflow-hidden w-10 h-10">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={50}
                  height={50}
                  className="relative z-10 object-cover w-full h-full"
                  unoptimized
                  priority
                />
              </div>
              <span className="font-bold text-xl tracking-tight">RepoLens</span>
            </Link>
            <p className="text-[#8b949e] max-w-sm text-sm leading-relaxed font-medium">
              The intelligent AI engine that transforms your static codebase into a living,
              responsive, and queryable knowledge graph.
            </p>
            <div className="flex space-x-4 pt-2">
              <a
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9] hover:border-[#8b949e]/50 transition-all duration-300"
              >
                <Github size={16} />
              </a>
              <a
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9] hover:border-[#8b949e]/50 transition-all duration-300"
              >
                <Twitter size={16} />
              </a>
              <a
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9] hover:border-[#8b949e]/50 transition-all duration-300"
              >
                <Linkedin size={16} />
              </a>
            </div>
          </div>

          {/* Links Section 1 */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm tracking-wide">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/dashboard"
                  className="text-[#8b949e] hover:text-[#58a6ff] transition-colors inline-block relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#58a6ff] hover:after:w-full after:transition-all after:duration-300"
                >
                  Workspace
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-[#8b949e] hover:text-[#58a6ff] transition-colors inline-block relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#58a6ff] hover:after:w-full after:transition-all after:duration-300"
                >
                  How it Works
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-[#8b949e] hover:text-[#58a6ff] transition-colors inline-block relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#58a6ff] hover:after:w-full after:transition-all after:duration-300"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/changelog"
                  className="text-[#8b949e] hover:text-[#58a6ff] transition-colors inline-block relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#58a6ff] hover:after:w-full after:transition-all after:duration-300"
                >
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Section 2 */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm tracking-wide">Resources</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/contact"
                  className="text-[#8b949e] hover:text-[#58a6ff] transition-colors inline-block relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#58a6ff] hover:after:w-full after:transition-all after:duration-300"
                >
                  Contact Support
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="text-[#8b949e] hover:text-[#58a6ff] transition-colors inline-block relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#58a6ff] hover:after:w-full after:transition-all after:duration-300"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-[#8b949e] hover:text-[#58a6ff] transition-colors inline-block relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#58a6ff] hover:after:w-full after:transition-all after:duration-300"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-[#8b949e] hover:text-[#58a6ff] transition-colors inline-block relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#58a6ff] hover:after:w-full after:transition-all after:duration-300"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#30363d]/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#8b949e] font-medium">
            &copy; {new Date().getFullYear()} RepoLens AI. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8b949e]">
            <span className="w-2 h-2 rounded-full bg-[#2ea043] animate-pulse"></span>
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
