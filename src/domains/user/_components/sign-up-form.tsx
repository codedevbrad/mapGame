"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signUpAction } from "@/domains/user/db";
import { signIn } from "next-auth/react";
import { mutate } from "swr";

type SignUpFormProps = {
  callbackUrl?: string;
};

export function SignUpForm({ callbackUrl }: SignUpFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const targetAfterSignup =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    startTransition(async () => {
      const result = await signUpAction(username, password);

      if (!result.success) {
        setError(result.error);
      } else {
        const signInResult = await signIn("credentials", {
          username,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          setError("Account created, but automatic sign-in failed. Please sign in.");
          router.push("/auth/signin");
          return;
        }

        // User created and signed in, redirect to home
        await mutate("user");
        router.push(targetAfterSignup);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isPending}
            placeholder="Choose a username"
            className="w-full rounded border border-white/20 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-400"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isPending}
            placeholder="Choose a password (min. 6 characters)"
            className="w-full rounded border border-white/20 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-400"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isPending}
            placeholder="Confirm your password"
            className="w-full rounded border border-white/20 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-400"
          />
        </div>
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="w-full cursor-pointer rounded border border-cyan-400/45 bg-black/65 px-3 py-2 text-sm uppercase tracking-wide text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Creating account..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
