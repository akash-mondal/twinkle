import {
  Navbar,
  Hero,
  SocialProof,
  HowItWorks,
  ProductShowcase,
  Features,
  Integrations,
  CTA,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#09090B]">
      <Navbar />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <ProductShowcase />
      <Features />
      <Integrations />
      <CTA />
      <Footer />
    </main>
  );
}
