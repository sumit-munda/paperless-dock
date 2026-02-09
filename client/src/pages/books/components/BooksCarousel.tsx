import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const BooksCarousel = () => {
  return (
    <Carousel
      opts={{
        align: "start",
      }}
      className="w-full my-2"
    >
      <CarouselContent>
        {Array.from({ length: 10 }).map((_, index) => (
          <CarouselItem
            key={index}
            className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
          >
            <div className="flex items-end justify-center py-6">
              <div className="relative flex h-[200px] w-full max-w-[140px] items-end justify-center">
                {/* Oval base (aura) */}
                <div
                  className="
          absolute
          bottom-0
          h-24
          w-full
         rounded-tl-[60%]
         rounded-tr-[80%]
         rounded-bl-[50%]
         rounded-br-[60%]
          bg-muted
        "
                />

                {/* Book image */}
                <img
                  src={`src/assets/banner-carousel/${index + 1}.png`}
                  alt="book-cover"
                  className="
          relative
          z-10
          h-[65%]
          w-[80%]
          object-contain
        "
                />
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
};

export default BooksCarousel;
