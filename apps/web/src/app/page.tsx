import { createClient } from "@/lib/supabase/server";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { FeatureAlternating } from "@/components/landing/FeatureAlternating";
import { DarkThemeShowcase } from "@/components/landing/DarkThemeShowcase";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { HiringManagerSection } from "@/components/landing/HiringManagerSection";
import { Footer } from "@/components/landing/Footer";

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-zinc-900 font-sans overflow-x-hidden">
      <LandingNav user={user} />
      
      <main>
        <HeroSection />
        <TrustSection />
        <FeatureAlternating />
        <DarkThemeShowcase />
        <FeatureGrid />
        <HiringManagerSection />
        <FinalCtaSection />
      </main>

      <Footer />
    </div>
  );
}
