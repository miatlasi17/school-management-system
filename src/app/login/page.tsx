import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-6" />
          </div>
          <h1 className="text-xl font-semibold">Brightwood School</h1>
          <p className="text-sm text-muted-foreground">Sign in to the school management system</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
        <div className="rounded-lg border bg-background p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Demo accounts (password: Password123!)</p>
          <p>Admin: admin@school.test</p>
          <p>Teacher: priya.sharma@school.test</p>
          <p>Student: check Admin → Students for a seeded email</p>
        </div>
      </div>
    </div>
  );
}
