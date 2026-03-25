"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";

function isProtectedPath(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/ideas/");
}

export function AuthRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const protectedPath = isProtectedPath(pathname);

  useEffect(() => {
    if (!loading && !user && protectedPath) {
      router.replace("/login");
    }
  }, [loading, user, protectedPath, router]);

  if (protectedPath && (loading || !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600 dark:bg-black dark:text-zinc-300">
        Checking authentication...
      </div>
    );
  }

  return <>{children}</>;
}
