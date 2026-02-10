import PromoCard from "@/components/common/PromoCard";
import BookCard from "./BookCard";

const BooksSection = ({ title }: { title: string }) => {
  return (
    <div>
      <h2>{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <BookCard />
        <BookCard />
        <BookCard />
        <BookCard />
        <PromoCard className="col-span-2 md:col-span-2 lg:col-span-1"/>
      </div>
    </div>
  );
};

export default BooksSection;
