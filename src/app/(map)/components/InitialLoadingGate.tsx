"use client";

import { useEffect, useState } from "react";

const PROJECT_NAME = "WORLDVIEW";
const INITIAL_LOADING_SECONDS = 2;

type InitialLoadingGateProps = {
  children: React.ReactNode;
};

export default function InitialLoadingGate({ children }: InitialLoadingGateProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, INITIAL_LOADING_SECONDS * 1000);

    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="hud-title text-4xl tracking-[0.5em]">{PROJECT_NAME}</div>
      </div>
    );
  }

  return <>{children}</>;
}
