"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { Github, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { loginWithMock, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/analytics");
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Sign in to ViralLink</CardTitle>
          <CardDescription>
            Choose your preferred sign in method
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            {/* Real OAuth Endpoints */}
          <Button variant="outline" className="w-full" asChild>
            <Link href="/oauth2/authorization/google">
                <Mail className="mr-2 h-4 w-4" />
                Sign in with Google
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/oauth2/authorization/github">
                <Github className="mr-2 h-4 w-4" />
                Sign in with GitHub
            </Link>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                For Development
              </span>
            </div>
          </div>

          <Button 
            className="w-full bg-slate-900 text-white hover:bg-slate-800"
            onClick={loginWithMock}
          >
            Dev Login (Admin)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
