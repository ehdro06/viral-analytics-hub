"use client";

import { Button } from "@/components/ui/button";
import Wordmark from "@/components/Wordmark";
import { useUser } from "@/hooks/use-user";
import { Github } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}

export default function LoginPage() {
  const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex h-14 w-full max-w-5xl items-center px-4 sm:px-6">
        <Wordmark />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-[12vh]">
        <div className="w-full max-w-sm">
          <h1 className="text-page-title text-foreground">Sign in to ViralLink</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No password needed. Your first sign-in creates the account.
          </p>

          <div className="mt-8 grid gap-3">
            <Button variant="outline" size="lg" asChild>
              <a href={`${backendBase}/oauth2/authorization/google`}>
                <GoogleMark />
                Continue with Google
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href={`${backendBase}/oauth2/authorization/github`}>
                <Github />
                Continue with GitHub
              </a>
            </Button>
          </div>

          <p className="mt-6 text-meta text-muted-foreground">
            By signing in, you agree to the{" "}
            <Link href="/terms" className="text-foreground underline underline-offset-4">
              terms of service
            </Link>{" "}
            and the{" "}
            <Link href="/privacy" className="text-foreground underline underline-offset-4">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
