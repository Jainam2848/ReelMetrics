"use client";

import React from "react";
import { SWRConfig } from "swr";
import { MotionProvider } from "@/components/shared/motion-provider";
import { ToastProvider } from "@/components/shared/toast";
import { ActiveAccountProvider } from "@/components/shared/active-account-context";

interface ProvidersProps {
  children: React.ReactNode;
}

const swrConfig = {
  fetcher: (url: string) =>
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("HTTP error in fetcher");
        return res.json();
      })
      .then((json) => {
        if (!json.success) throw new Error(json.error?.message || "API request failed");
        return json.data;
      }),
  revalidateOnFocus: false,
  shouldRetryOnError: false,
};

export function Providers({ children }: ProvidersProps) {
  return (
    <SWRConfig value={swrConfig}>
      <MotionProvider>
        <ToastProvider>
          <ActiveAccountProvider>
            {children}
          </ActiveAccountProvider>
        </ToastProvider>
      </MotionProvider>
    </SWRConfig>
  );
}
