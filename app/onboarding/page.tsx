"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingFlow from "@/app/components/OnboardingFlow";
import { isOnboarded } from "@/lib/onboarding";

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    if (isOnboarded()) {
      router.replace("/ritual");
    }
  }, [router]);

  return <OnboardingFlow />;
}
