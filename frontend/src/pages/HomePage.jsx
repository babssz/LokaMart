import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import MemberHero from "../components/MemberHero";
import CategoryGrid from "../components/CategoryGrid";
import ProductSection from "../components/ProductSection";
import StorySection from "../components/StorySection";
import WhyShop from "../components/WhyShop";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-neutral-900">
      <Navbar />
      <main className="flex-1">
        {user ? (
          <>
            <MemberHero />
            <CategoryGrid />
            <ProductSection eyebrow="" subtitle="" title="Sorotan lokal minggu ini" limit={5} bg="bg-white" />
            <StorySection />
            <WhyShop showHeading={false} bg="bg-blush" />
          </>
        ) : (
          <>
            <Hero />
            <ProductSection />
            <WhyShop />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}