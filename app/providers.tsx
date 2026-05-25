"use client";

import React from "react";
import { SWRConfig } from "swr";
import { MotionProvider } from "@/components/shared/motion-provider";
import { ToastProvider } from "@/components/shared/toast";
import { ActiveAccountProvider } from "@/components/shared/active-account-context";
import { apiFetcher } from "@/lib/api/client-fetcher";

interface ProvidersProps {
  children: React.ReactNode;
}

const swrConfig = {
  fetcher: apiFetcher,
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
