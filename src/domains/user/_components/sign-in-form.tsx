"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signInAction } from "@/domains/user/db";
import { mutate } from "swr";

type SignInFormProps = {
  callbackUrl?: string;
};

export function SignInForm({ callbackUrl }: SignInFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const targetAfterLogin =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/game";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await signInAction(username, password);

      if (!result.success) {
        setError(result.error);
      } else {
        // Revalidate the user cache to update the header
        await mutate("user");
        router.push(targetAfterLogin);
        router.refresh();
      }
    });
  };

  return (
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
          placeholder="Enter your username"
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
          placeholder="Enter your password"
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
        {isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
