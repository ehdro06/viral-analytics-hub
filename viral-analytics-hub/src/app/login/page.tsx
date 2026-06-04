"use client";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth-store";
import { Github, Mail, Command } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isHydrated, router]);

  return (
    <div className="container relative h-screen max-w-none flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-[#09090b] text-zinc-100">
      <div className="relative hidden h-full flex-col bg-zinc-900 p-10 text-white lg:flex border-r border-zinc-800">
        <div className="absolute inset-0 bg-zinc-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] filter mix-blend-screen opacity-50 block" />

        <div className="relative z-20 flex items-center text-lg font-medium tracking-tight">
          <Command className="mr-2 h-6 w-6 text-indigo-500" />
          ViralLink
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2" />
        </div>
      </div>

      <div className="lg:p-8 flex items-center justify-center h-full">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Sign in
            </h1>
            <p className="text-sm text-zinc-400">
              OAuth via Google or GitHub. You&apos;ll land on the dashboard with a JWT for API calls.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-3">
              <Button
                variant="outline"
                className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white h-11 relative"
                asChild
              >
                <a href="/oauth2/authorization/google" className="flex items-center justify-center w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Sign in with Google
                </a>
              </Button>
              <Button
                variant="outline"
                className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white h-11 relative"
                asChild
              >
                <a href="/oauth2/authorization/github" className="flex items-center justify-center w-full">
                  <Github className="mr-2 h-4 w-4" />
                  Sign in with GitHub
                </a>
              </Button>
            </div>

            <p className="px-8 text-center text-sm text-zinc-500">
              Configure <code className="text-xs">GOOGLE_*</code> / <code className="text-xs">GITHUB_*</code> in{" "}
              <code className="text-xs">.env</code> for the user service (port 8080).
            </p>
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 lg:hidden">
        <Link href="/" className="flex items-center space-x-2 font-bold text-lg text-white">
          <Command className="h-5 w-5 text-indigo-500" />
          <span>ViralLink</span>
        </Link>
      </div>
    </div>
  );
}
