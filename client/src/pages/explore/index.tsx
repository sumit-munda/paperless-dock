import BannerCarousel from "@/pages/explore/components/carousel/BannerCarousel";
import BooksCarousel from "@/pages/explore/components/carousel/BooksCarousel";
import PromoSection from "./components/PromoSection";
import BooksSection from "./components/BooksSection";
import PromoCard from "@/components/common/PromoCard";

const Explore = () => {
  return (
    <section aria-labelledby="explore-page" className="px-6 py-4">
      <BannerCarousel />
      <BooksCarousel />
      <PromoSection />
      <BooksSection title="Trending Now" />
      <BooksSection title="Bestselling Books" />
      <BooksSection title="Popular Books" />
      <PromoCard className="aspect-7/2" />
    </section>
  );
};

export default Explore;
