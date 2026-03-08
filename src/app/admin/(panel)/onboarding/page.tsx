import OnboardingWrapper from "./wrapper";

interface PageProps {
  searchParams: Promise<{ error?: string; created?: string; brandingSaved?: string; businessUpdated?: string }>;
}

export default function OnboardingPage({ searchParams }: PageProps) {
  return <OnboardingWrapper searchParams={searchParams} />;
}
