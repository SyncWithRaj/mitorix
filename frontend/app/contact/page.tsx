"use client";

import Footer from "@/components/layout/Footer";
import { Mail, MessageCircle, MapPin, Send, MessageSquareText } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="flex flex-col flex-grow items-center w-full min-h-screen bg-[#0d1117] text-[#c9d1d9] selection:bg-[#58a6ff] selection:text-white pt-32 pb-40 overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#a371f7]/10 via-[#58a6ff]/5 to-transparent blur-[120px] rounded-full pointer-events-none"></div>

      {/* Header Section */}
      <div className="max-w-3xl text-center px-6 mb-20 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1f6feb]/10 border border-[#1f6feb]/30 text-[#58a6ff] text-xs font-semibold uppercase tracking-wider mb-8 shadow-sm">
          <MessageSquareText size={14} className="text-[#58a6ff]" />
          Support & Inquiry
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter pb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-[#c9d1d9]">
          Get in Touch
        </h1>
        <p className="text-[#8b949e] text-xl leading-relaxed font-light max-w-2xl mx-auto">
          Have questions about RepoLens enterprise integration, feature requests, or encountered a
          bug? We'd love to hear from you. Our engineering team responds within 24 hours.
        </p>
      </div>

      <div className="w-full max-w-6xl px-6 grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 relative z-10 mb-20">
        {/* Contact info cards */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="group bg-[#161b22]/50 backdrop-blur-md border border-[#30363d]/80 rounded-3xl p-8 shadow-md hover:border-[#58a6ff]/50 hover:shadow-[0_0_30px_rgba(88,166,255,0.15)] transition-all duration-500 hover:-translate-y-1">
            <div className="flex items-center gap-5 mb-4">
              <div className="bg-[#21262d] border border-[#30363d] p-4 rounded-2xl group-hover:bg-[#58a6ff]/10 group-hover:border-[#58a6ff]/50 transition-colors shadow-inner">
                <Mail className="w-6 h-6 text-[#58a6ff] group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Email Us</h3>
            </div>
            <div className="space-y-2 mt-4 ml-[72px]">
              <a
                href="mailto:hello@repolens.ai"
                className="block text-[#8b949e] text-base hover:text-[#58a6ff] transition-colors leading-relaxed font-medium"
              >
                hello@repolens.ai
              </a>
              <a
                href="mailto:support@repolens.ai"
                className="block text-[#8b949e] text-base hover:text-[#58a6ff] transition-colors leading-relaxed font-medium"
              >
                support@repolens.ai
              </a>
            </div>
          </div>

          <div className="group bg-[#161b22]/50 backdrop-blur-md border border-[#30363d]/80 rounded-3xl p-8 shadow-md hover:border-[#2ea043]/50 hover:shadow-[0_0_30px_rgba(46,160,67,0.15)] transition-all duration-500 hover:-translate-y-1">
            <div className="flex items-center gap-5 mb-4">
              <div className="bg-[#21262d] border border-[#30363d] p-4 rounded-2xl group-hover:bg-[#2ea043]/10 group-hover:border-[#2ea043]/50 transition-colors shadow-inner">
                <MessageCircle className="w-6 h-6 text-[#2ea043] group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">X / Twitter</h3>
            </div>
            <p className="mt-4 ml-[72px]">
              <a
                href="#"
                className="font-medium text-[#8b949e] text-base hover:text-[#2ea043] hover:underline transition-colors block"
              >
                @repolens
              </a>
            </p>
          </div>

          <div className="group bg-[#161b22]/50 backdrop-blur-md border border-[#30363d]/80 rounded-3xl p-8 shadow-md hover:border-[#a371f7]/50 hover:shadow-[0_0_30px_rgba(163,113,247,0.15)] transition-all duration-500 hover:-translate-y-1 fill-available">
            <div className="flex items-center gap-5 mb-4">
              <div className="bg-[#21262d] border border-[#30363d] p-4 rounded-2xl group-hover:bg-[#a371f7]/10 group-hover:border-[#a371f7]/50 transition-colors shadow-inner">
                <MapPin className="w-6 h-6 text-[#a371f7] group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Headquarters</h3>
            </div>
            <p className="text-[#8b949e] text-base ml-[72px] leading-relaxed font-medium mt-4">
              RepoLens Pvt. Ltd. <br />
              Block V, Innovation Hub <br />
              San Francisco, CA 94107
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="lg:col-span-3">
          <form className="bg-[#161b22]/80 backdrop-blur-xl p-10 md:p-12 rounded-[2rem] border border-[#30363d] space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] h-full flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#58a6ff]/5 blur-3xl rounded-full pointer-events-none group-hover:bg-[#58a6ff]/10 transition-colors duration-700"></div>

            <div className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold tracking-wide text-[#c9d1d9] ml-1 uppercase">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="Linus"
                    className="w-full bg-[#010409]/80 backdrop-blur-sm border border-[#30363d] rounded-2xl px-5 py-4 text-white placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all shadow-inner hover:border-[#8b949e]/50"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-semibold tracking-wide text-[#c9d1d9] ml-1 uppercase">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Torvalds"
                    className="w-full bg-[#010409]/80 backdrop-blur-sm border border-[#30363d] rounded-2xl px-5 py-4 text-white placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all shadow-inner hover:border-[#8b949e]/50"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold tracking-wide text-[#c9d1d9] ml-1 uppercase">
                  Corporate Email
                </label>
                <input
                  type="email"
                  placeholder="linus@linux.org"
                  className="w-full bg-[#010409]/80 backdrop-blur-sm border border-[#30363d] rounded-2xl px-5 py-4 text-white placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all shadow-inner hover:border-[#8b949e]/50"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold tracking-wide text-[#c9d1d9] ml-1 uppercase">
                  How can we help?
                </label>
                <textarea
                  rows={6}
                  placeholder="Detail your inquiry regarding architectural integration or enterprise requirements..."
                  className="w-full bg-[#010409]/80 backdrop-blur-sm border border-[#30363d] rounded-2xl px-5 py-4 text-white placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all resize-y shadow-inner hover:border-[#8b949e]/50 text-base leading-relaxed"
                ></textarea>
              </div>
            </div>

            <div className="pt-8 relative z-10 w-full md:w-auto self-end">
              <button
                type="button"
                className="w-full md:w-auto px-12 py-4 rounded-xl flex items-center justify-center gap-4 bg-[#238636] hover:bg-[#2ea043] font-bold text-white transition-all duration-300 shadow-[0_0_20px_rgba(35,134,54,0.3)] hover:shadow-[0_0_30px_rgba(46,160,67,0.5)] border border-[#3fb950]/30 hover:border-[#3fb950] group/btn"
                onClick={() => alert("This is a demo UI. Messaging API is currently disabled.")}
              >
                Send Message
                <Send className="w-5 h-5 group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
