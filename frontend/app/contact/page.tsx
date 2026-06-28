"use client";

import { Mail, MessageCircle, Linkedin, Send, MessageSquareText } from "lucide-react";
import Silk from "@/components/ui/Silk";

export default function ContactPage() {
  return (
    <div className="w-full h-screen overflow-hidden bg-black text-[#e5e5e5] selection:bg-[#ff6b00] selection:text-white relative flex flex-col">
      {/* Background decorations */}
      <div className="absolute inset-0 z-0 opacity-[0.25] pointer-events-none">
        <Silk color="#ff6b00" speed={4} scale={1.5} noiseIntensity={2} />
      </div>
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none z-0"
        style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
      ></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_20%,transparent_100%)] pointer-events-none z-0"></div>

      {/* Main Content - Adjusted for pt-24 (navbar) to fit perfectly */}
      <div className="relative z-10 w-full h-full pt-24 pb-8 px-6 lg:px-12 xl:px-24 flex items-center justify-center">
        <div className="w-full max-w-7xl h-full max-h-[800px] grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          
          {/* Left Column - Info & Cards */}
          <div className="flex flex-col justify-center h-full">
            <div className="mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/30 text-[#ff6b00] text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
                <MessageSquareText size={14} className="text-[#ff6b00]" />
                Support & Inquiry
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-white mb-4 tracking-tighter pb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-[#e5e5e5]">
                Get in Touch
              </h1>
              <p className="text-[#a3a3a3] text-lg leading-relaxed font-light">
                Have questions about Mitorix enterprise integration, feature requests, or encountered a bug? We'd love to hear from you. Our engineering team responds within 24 hours.
              </p>
            </div>

            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
              {/* Card 1 */}
              <div className="group bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-lg hover:border-[#ff6b00]/50 hover:bg-white/10 transition-all duration-300 flex items-center gap-5 cursor-default">
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl group-hover:bg-[#ff6b00]/20 group-hover:border-[#ff6b00]/50 transition-colors shadow-inner">
                  <Mail className="w-5 h-5 text-[#ff6b00] group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Email Us</h3>
                  <div className="text-sm text-[#d4d4d8] mt-1 space-x-4">
                    <a href="mailto:hello@mitorix.ai" className="hover:text-[#ff6b00] transition-colors">hello@mitorix.ai</a>
                    <a href="mailto:support@mitorix.ai" className="hover:text-[#ff6b00] transition-colors">support@mitorix.ai</a>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="group bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-lg hover:border-[#ff8c00]/50 hover:bg-white/10 transition-all duration-300 flex items-center gap-5 cursor-default">
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl group-hover:bg-[#ff8c00]/20 group-hover:border-[#ff8c00]/50 transition-colors shadow-inner">
                  <MessageCircle className="w-5 h-5 text-[#ff8c00] group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">X / Twitter</h3>
                  <p className="text-sm text-[#d4d4d8] mt-1">
                    <a href="#" className="hover:text-[#ff8c00] transition-colors">@mitorix</a>
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="group bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-lg hover:border-[#ffa800]/50 hover:bg-white/10 transition-all duration-300 flex items-center gap-5 cursor-default">
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl group-hover:bg-[#ffa800]/20 group-hover:border-[#ffa800]/50 transition-colors shadow-inner">
                  <Linkedin className="w-5 h-5 text-[#ffa800] group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">LinkedIn</h3>
                  <div className="text-sm text-[#d4d4d8] mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <a href="https://linkedin.com/company/mitorix" target="_blank" rel="noopener noreferrer" className="hover:text-[#ffa800] transition-colors">Mitorix Page</a>
                    <a href="https://linkedin.com/in/rajribadiya" target="_blank" rel="noopener noreferrer" className="hover:text-[#ffa800] transition-colors">Raj Ribadiya</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form Container */}
          <div className="flex flex-col justify-center h-full animate-in fade-in zoom-in-95 duration-1000 delay-500 fill-mode-both">
            <form className="bg-black/40 backdrop-blur-2xl p-8 lg:p-10 rounded-[2rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex flex-col justify-between group/form relative overflow-hidden h-full max-h-[700px]">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#ff6b00]/10 blur-3xl rounded-full pointer-events-none group-hover/form:bg-[#ff6b00]/20 transition-colors duration-700"></div>

              <div className="space-y-6 relative z-10 flex-grow flex flex-col justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold tracking-widest text-[#d4d4d8] ml-1 uppercase">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="Linus"
                      className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00] transition-all shadow-inner hover:border-white/20 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold tracking-widest text-[#d4d4d8] ml-1 uppercase">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Torvalds"
                      className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00] transition-all shadow-inner hover:border-white/20 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold tracking-widest text-[#d4d4d8] ml-1 uppercase">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    placeholder="linus@linux.org"
                    className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00] transition-all shadow-inner hover:border-white/20 text-sm"
                  />
                </div>

                <div className="space-y-2 flex-grow flex flex-col">
                  <label className="block text-[11px] font-bold tracking-widest text-[#d4d4d8] ml-1 uppercase">
                    How can we help?
                  </label>
                  <textarea
                    placeholder="Detail your inquiry regarding architectural integration or enterprise requirements..."
                    className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-4 py-4 text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00] transition-all resize-none shadow-inner hover:border-white/20 text-sm leading-relaxed flex-grow min-h-[120px]"
                  ></textarea>
                </div>
              </div>

              <div className="pt-6 relative z-10 w-full mt-auto">
                <button
                  type="button"
                  className="relative w-full py-4 rounded-xl flex items-center justify-center gap-3 bg-[#ff6b00] text-white font-semibold text-sm transition-all duration-300 shadow-[0_0_20px_rgba(255,107,0,0.25)] border border-[#ff8c00]/30 group/btn overflow-hidden"
                  onClick={() => alert("This is a demo UI. Messaging API is currently disabled.")}
                >
                  {/* Fill up from bottom hover effect */}
                  <div className="absolute inset-0 bg-white origin-bottom scale-y-0 group-hover/btn:scale-y-100 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] z-0"></div>
                  
                  <span className="relative z-10 group-hover/btn:text-black transition-colors duration-500 flex items-center gap-3">
                    Send Message
                    <Send className="w-4 h-4 group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1 group-hover/btn:text-black transition-all duration-500" />
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
