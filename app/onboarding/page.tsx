"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OnboardingFlow from "@/app/components/OnboardingFlow";
import { clearOnboarded, isOnboarded } from "@/lib/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetRequested = searchParams.get("reset") === "1";

  useEffect(() => {
    if (resetRequested) {
      clearOnboarded();
      return;
    }

    if (isOnboarded()) {
      router.replace("/ritual");
    }
  }, [resetRequested, router]);

  return <OnboardingFlow />;
}
