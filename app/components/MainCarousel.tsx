import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/app/components/ui/carousel";
import { Button } from "@/app/components/ui/button";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "framer-motion";
import { type CarouselApi } from "@/app/components/ui/carousel";

const MainCarousel = () => {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [api, setApi] = React.useState<CarouselApi>();
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  React.useEffect(() => {
    if (!api) {
      return;
    }

    api.on("select", () => {
      setCurrentSlide(api.selectedScrollSnap());
    });
  }, [api]);

  const slides = [
    {
      image: "/IMG_2015 2.jpg",
      title: "25-26 부산지구 채움총단 소개",
      description: "부산지구, 부산땅에 예수님으로 가득 채워지길 소망합니다✨",
      link: "https://www.instagram.com/p/DOKY7XBkix9/?igsh=MTFnbDM1ejZ4em5scQ==",
    },
  ];

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
      <Carousel
        plugins={[plugin.current]}
        className="w-full h-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
          duration: 30,
          skipSnaps: false,
          dragFree: false,
        }}
      >
        <CarouselContent className="-ml-0">
          {slides.map((slide, index) => (
            <CarouselItem key={index} className="pl-0">
              <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover blur-[0.2rem]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                {currentSlide === index && (
                  <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 md:px-16 lg:px-24">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="text-white max-w-2xl space-y-3 sm:space-y-4 md:space-y-6"
                    >
                      <motion.h1
                        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                      >
                        {slide.title}
                      </motion.h1>
                      <motion.p
                        className="text-sm sm:text-base md:text-lg lg:text-xl whitespace-pre-line"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                      >
                        {slide.description}
                      </motion.p>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                      >
                        <Button
                          asChild
                          variant="outline"
                          size="lg"
                          className="bg-white text-black hover:bg-white/90 hover:scale-105 transition-all text-sm sm:text-base"
                        >
                          {/* blank */}
                          <a href={slide.link} target="_blank">
                            자세히 보기
                          </a>
                        </Button>
                      </motion.div>
                    </motion.div>
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 items-center">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`h-1.5 sm:h-2 rounded-full transition-all ${
                currentSlide === index
                  ? "w-6 sm:w-8 bg-white"
                  : "w-1.5 sm:w-2 bg-white/50 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
};

export default MainCarousel;
