"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import OnboardingFlow from "@/app/components/OnboardingFlow";
import { clearOnboarded } from "@/lib/onboarding";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingFlow />}>
      <OnboardingPageContent />
    </Suspense>
  );
}

function OnboardingPageContent() {
  const searchParams = useSearchParams();
  const resetRequested = searchParams.get("reset") === "1";

  useEffect(() => {
    if (resetRequested) {
      clearOnboarded();
    }
  }, [resetRequested]);

  return <OnboardingFlow />;
}
