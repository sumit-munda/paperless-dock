import { cn } from "@/lib/utils";

const PromoCard = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl aspect-video",
        className,
      )}
    >
      <img
        src="src/assets/promo-cards/2.png"
        alt="Promo A"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 p-6 text-white">
        <h3 className="text-xl font-semibold">Promo A</h3>
        <p className="mt-2 text-sm opacity-90">
          Short supporting copy goes here
        </p>
      </div>
    </div>
  );
};

export default PromoCard;
