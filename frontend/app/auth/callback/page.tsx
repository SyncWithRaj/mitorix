"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      // Store token in cookie on the frontend's own domain
      document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure`;
      router.replace("/dashboard");
    } else {
      // No token means auth failed
      router.replace("/login");
    }
  }, [searchParams, router]);

  return (
    <div className="flex-grow flex items-center justify-center bg-[#0d1117] text-[#c9d1d9]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-[#8b949e] font-medium">Authenticating...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center bg-[#0d1117] text-[#c9d1d9]">
          <div className="w-8 h-8 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <AuthCallbackHandler />
    </Suspense>
  );
}
