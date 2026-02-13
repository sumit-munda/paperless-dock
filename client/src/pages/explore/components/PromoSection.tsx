import PromoCard from "@/components/common/PromoCard";

const PromoSection = () => {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <PromoCard/>
      <PromoCard/>
    </div>
  );
};

export default PromoSection;


