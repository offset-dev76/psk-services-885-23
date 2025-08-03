import React from 'react';
import { Card } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Play, Info } from 'lucide-react';
interface CarouselItem {
  id: number;
  title: string;
  description: string;
  image: string;
  category: string;
}
const carouselItems: CarouselItem[] = [{
  id: 1,
  title: "The Latest Blockbuster",
  description: "Experience the most thrilling adventure of the year with stunning visuals and an epic storyline.",
  image: "/lovable-uploads/ef5a1f6f-4ce1-4183-9610-66d923750591.png",
  category: "Action & Adventure"
}, {
  id: 2,
  title: "Trending Drama Series",
  description: "Dive into compelling characters and emotional storytelling in this critically acclaimed series.",
  image: "/lovable-uploads/8acfad30-aa90-4edd-b779-aafd43058584.png",
  category: "Drama"
}, {
  id: 3,
  title: "Comedy Special",
  description: "Laugh out loud with the funniest content available on your smart TV platform.",
  image: "/lovable-uploads/ada582c7-709e-480e-8494-1461b602567c.png",
  category: "Comedy"
}];
const TVCarousel: React.FC = () => {
  return <Carousel className="w-full max-w-7xl mx-auto">
      <CarouselContent>
        {carouselItems.map(item => <CarouselItem key={item.id}>
            <Card className="relative overflow-hidden border-none bg-transparent">
              <div className="relative h-[500px] w-full">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover rounded-lg" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent rounded-lg" />
                <div className="absolute bottom-0 left-0 p-8 text-white max-w-lg">
                  
                  <h2 className="text-5xl md:text-6xl font-black mb-4">{item.title}</h2>
                  <p className="text-gray-300 mb-6 text-lg">{item.description}</p>
                  <div className="flex gap-4">
                    <button className="bg-white text-black px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-200 transition-colors">
                      <Play size={20} fill="currentColor" />
                      Play Now
                    </button>
                    <button className="bg-gray-600/80 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-600 transition-colors">
                      <Info size={20} />
                      More Info
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </CarouselItem>)}
      </CarouselContent>
      <CarouselPrevious 
        data-carousel-prev
        className="left-4 bg-black/50 border-white/20 text-white hover:bg-black/70" 
      />
      <CarouselNext 
        data-carousel-next
        className="right-4 bg-black/50 border-white/20 text-white hover:bg-black/70" 
      />
    </Carousel>;
};
export default TVCarousel;