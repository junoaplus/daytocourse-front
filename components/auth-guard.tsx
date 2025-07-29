// components/auth-guard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { TokenStorage, UserStorage, clearAuthStorage } from "@/lib/storage";
import { useAuth } from "@/contexts/auth-context";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading: isAuthLoading } = useAuth();

  const [authState, setAuthState] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (typeof window === "undefined") return;

    const token = TokenStorage.get();
    const user = UserStorage.get();
    const openPaths = ["/", "/login", "/signup", "/login/callback", "/admin"];
    
    // 특별한 경우: /community는 공개이지만 /community/courses로 시작하는 모든 경로는 로그인 필요
    const isOpenPath = openPaths.some(p => pathname.startsWith(p)) || 
                      (pathname === "/community" && !pathname.startsWith("/community/courses"));

    // ✅ 공개 경로 처리
    if (isOpenPath) {
      if (token && user) {
        // 로그인 되어 있는데 /login 접속 시
        if (pathname === "/login") {
          if (user.nickname) {
            router.replace("/"); // 메인 페이지로 리다이렉트
            return;
          } else {
            router.replace("/signup");
            return;
          }
        }
      }

      setAuthState("authenticated");
      return;
    }

    // ✅ 비공개 경로 처리
    if (!token || !user) {
      clearAuthStorage();
      router.replace("/login");
      return;
    }

    // ✅ 닉네임 미완성 → signup 페이지로
    if (!user.nickname && pathname !== "/signup") {
      router.replace("/signup");
      return;
    }

    // ✅ 닉네임 있음 + /signup에 들어옴 → 메인 페이지로
    if (user.nickname && pathname === "/signup") {
      router.replace("/");
      return;
    }

    // ✅ 홈 페이지는 메인 페이지로 사용 (리다이렉트 제거)

    setAuthState("authenticated");
  }, [pathname, isAuthLoading, router]);

  // ✅ loading 상태
  if (authState === "loading" || isAuthLoading) {
    return <div className="p-6">인증 상태 확인 중...</div>;
  }

  // ✅ 인증 후 children 노출
  return <>{children}</>;
}

export function logout() {
  clearAuthStorage();
  window.location.href = "/login";
}