"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetRequested = searchParams.get("reset") === "1";

  useEffect(() => {
    if (resetRequested) {
      clearOnboarded();
      return;
    }

    if (typeof window !== "undefined" && window.localStorage.getItem("rin_onboarded") === "true") {
      router.replace("/ritual");
    }
  }, [resetRequested, router]);

  return <OnboardingFlow />;
}
