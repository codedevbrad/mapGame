import { SignUpForm } from "@/domains/user/_components/sign-up-form";
import Link from "next/link";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl =
    typeof params?.callbackUrl === "string" ? params.callbackUrl : undefined;
  const signInHref = callbackUrl
    ? `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/auth/signin";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Sign Up</h1>
          <p className="text-muted-foreground">
            Create your account and organisation
          </p>
        </div>
        <SignUpForm callbackUrl={callbackUrl} />
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link href={signInHref} className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
