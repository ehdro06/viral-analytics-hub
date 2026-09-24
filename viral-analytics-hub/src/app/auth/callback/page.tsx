"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/hooks/use-auth-store";
import { Loader2 } from "lucide-react";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get("token");
    const id = searchParams.get("id");
    const email = searchParams.get("email");
    const name = searchParams.get("name");

    if (!token || !id || !email) {
      router.replace("/login?error=auth_failed");
      return;
    }

    setUser(
      {
        id: String(id),
        email,
        name: name || email.split("@")[0],
        tier: "FREE",
      },
      token
    );

    router.replace("/dashboard");
  }, [searchParams, router, setUser]);

  return (
    <div className="flex h-screen items-center justify-center bg-background text-muted-foreground gap-3">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span>Signing you in…</span>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
