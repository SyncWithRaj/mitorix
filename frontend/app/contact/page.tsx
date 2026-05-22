"use client";

import Footer from "@/components/layout/Footer";
import { Mail, MessageCircle, MapPin, Send, MessageSquareText } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="flex flex-col flex-grow items-center w-full min-h-screen bg-[#000000] text-[#e5e5e5] selection:bg-[#ff6b00] selection:text-white pt-32 pb-40 overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#ff6b00]/5 via-[#ff8c00]/5 to-transparent blur-[120px] rounded-full pointer-events-none"></div>

      {/* Header Section */}
      <div className="max-w-3xl text-center px-6 mb-20 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/30 text-[#ff6b00] text-xs font-semibold uppercase tracking-wider mb-8 shadow-sm">
          <MessageSquareText size={14} className="text-[#ff6b00]" />
          Support & Inquiry
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter pb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-[#e5e5e5]">
          Get in Touch
        </h1>
        <p className="text-[#737373] text-xl leading-relaxed font-light max-w-2xl mx-auto">
          Have questions about RepoLens enterprise integration, feature requests, or encountered a
          bug? We'd love to hear from you. Our engineering team responds within 24 hours.
        </p>
      </div>

      <div className="w-full max-w-6xl px-6 grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 relative z-10 mb-20">
        {/* Contact info cards */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="group bg-[#050505]/50 backdrop-blur-md border border-[#1a1a1a] rounded-3xl p-8 shadow-md hover:border-[#ff6b00]/50 hover:shadow-[0_0_30px_rgba(255,107,0,0.15)] transition-all duration-500 hover:-translate-y-1">
            <div className="flex items-center gap-5 mb-4">
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded-2xl group-hover:bg-[#ff6b00]/10 group-hover:border-[#ff6b00]/50 transition-colors shadow-inner">
                <Mail className="w-6 h-6 text-[#ff6b00] group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Email Us</h3>
            </div>
            <div className="space-y-2 mt-4 ml-[72px]">
              <a
                href="mailto:hello@repolens.ai"
                className="block text-[#737373] text-base hover:text-[#ff6b00] transition-colors leading-relaxed font-medium"
              >
                hello@repolens.ai
              </a>
              <a
                href="mailto:support@repolens.ai"
                className="block text-[#737373] text-base hover:text-[#ff6b00] transition-colors leading-relaxed font-medium"
              >
                support@repolens.ai
              </a>
            </div>
          </div>

          <div className="group bg-[#050505]/50 backdrop-blur-md border border-[#1a1a1a] rounded-3xl p-8 shadow-md hover:border-[#ff8c00]/50 hover:shadow-[0_0_30px_rgba(255,140,0,0.15)] transition-all duration-500 hover:-translate-y-1">
            <div className="flex items-center gap-5 mb-4">
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded-2xl group-hover:bg-[#ff8c00]/10 group-hover:border-[#ff8c00]/50 transition-colors shadow-inner">
                <MessageCircle className="w-6 h-6 text-[#ff8c00] group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">X / Twitter</h3>
            </div>
            <p className="mt-4 ml-[72px]">
              <a
                href="#"
                className="font-medium text-[#737373] text-base hover:text-[#ff8c00] hover:underline transition-colors block"
              >
                @repolens
              </a>
            </p>
          </div>

          <div className="group bg-[#050505]/50 backdrop-blur-md border border-[#1a1a1a] rounded-3xl p-8 shadow-md hover:border-[#ffa800]/50 hover:shadow-[0_0_30px_rgba(255,168,0,0.15)] transition-all duration-500 hover:-translate-y-1 fill-available">
            <div className="flex items-center gap-5 mb-4">
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded-2xl group-hover:bg-[#ffa800]/10 group-hover:border-[#ffa800]/50 transition-colors shadow-inner">
                <MapPin className="w-6 h-6 text-[#ffa800] group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Headquarters</h3>
            </div>
            <p className="text-[#737373] text-base ml-[72px] leading-relaxed font-medium mt-4">
              RepoLens Pvt. Ltd. <br />
              Block V, Innovation Hub <br />
              San Francisco, CA 94107
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="lg:col-span-3">
          <form className="bg-[#050505]/80 backdrop-blur-xl p-10 md:p-12 rounded-[2rem] border border-[#1a1a1a] space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] h-full flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#ff6b00]/5 blur-3xl rounded-full pointer-events-none group-hover:bg-[#ff6b00]/10 transition-colors duration-700"></div>

            <div className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold tracking-wide text-[#e5e5e5] ml-1 uppercase">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="Linus"
                    className="w-full bg-[#000000]/80 backdrop-blur-sm border border-[#1a1a1a] rounded-2xl px-5 py-4 text-white placeholder-[#737373] focus:outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00] transition-all shadow-inner hover:border-[#ff6b00]/30"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-semibold tracking-wide text-[#e5e5e5] ml-1 uppercase">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Torvalds"
                    className="w-full bg-[#000000]/80 backdrop-blur-sm border border-[#1a1a1a] rounded-2xl px-5 py-4 text-white placeholder-[#737373] focus:outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00] transition-all shadow-inner hover:border-[#ff6b00]/30"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold tracking-wide text-[#e5e5e5] ml-1 uppercase">
                  Corporate Email
                </label>
                <input
                  type="email"
                  placeholder="linus@linux.org"
                  className="w-full bg-[#000000]/80 backdrop-blur-sm border border-[#1a1a1a] rounded-2xl px-5 py-4 text-white placeholder-[#737373] focus:outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00] transition-all shadow-inner hover:border-[#ff6b00]/30"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold tracking-wide text-[#e5e5e5] ml-1 uppercase">
                  How can we help?
                </label>
                <textarea
                  rows={6}
                  placeholder="Detail your inquiry regarding architectural integration or enterprise requirements..."
                  className="w-full bg-[#000000]/80 backdrop-blur-sm border border-[#1a1a1a] rounded-2xl px-5 py-4 text-white placeholder-[#737373] focus:outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00] transition-all resize-y shadow-inner hover:border-[#ff6b00]/30 text-base leading-relaxed"
                ></textarea>
              </div>
            </div>

            <div className="pt-8 relative z-10 w-full md:w-auto self-end">
              <button
                type="button"
                className="w-full md:w-auto px-12 py-4 rounded-xl flex items-center justify-center gap-4 bg-[#ff6b00] hover:bg-[#ff8c00] font-semibold text-white transition-all duration-300 shadow-[0_0_20px_rgba(255,107,0,0.2)] hover:shadow-[0_0_30px_rgba(255,107,0,0.4)] border border-[#ff8c00]/30 hover:border-[#ff8c00] group/btn"
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
