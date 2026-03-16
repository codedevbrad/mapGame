
import Link from "next/link";
import { SignInForm } from "@/domains/user/_components/sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl =
    typeof params?.callbackUrl === "string" ? params.callbackUrl : undefined;
  const signUpHref = callbackUrl
    ? `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/auth/signup";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-muted-foreground">
            Enter your credentials to access your account
          </p>
        </div>
        {params?.registered === "true" && (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-200">
            Account created successfully! Please sign in.
          </div>
        )}
        <SignInForm callbackUrl={callbackUrl} />
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don&apos;t have an account? </span>
          <Link href={signUpHref} className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
