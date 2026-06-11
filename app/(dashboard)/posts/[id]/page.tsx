import React, { Suspense } from "react";
import PostDetailPageClient from "./post-detail-client";
import { LoadingSkeleton } from "@/components/dashboard/loading-skeleton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  return (
    <Suspense fallback={<LoadingSkeleton variant="detail" />}>
      <PostDetailPageClient params={params} />
    </Suspense>
  );
}
