import { BreadCrumb } from "@/components/common/BreadCrumb";
import { ComboBox } from "@/components/common/ComboBox";
import BookCard from "../explore/components/BookCard";
import { MdFilter, MdFilterList } from "react-icons/md";
import { TbArrowsSort } from "react-icons/tb";

const frameworks1 = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];
const frameworks2 = ["Next.js", "SvelteKit", "Nuxt.js", "Remix"];

const Books = () => {
  return (
    <section aria-labelledby="books-page" className="px-6 py-4">
      <div className="flex justify-between items-end my-4">
        <h1 className="scroll-m-20 text-4xl sm:text-5xl font-extrabold tracking-tight text-balance">
          Books
        </h1>
        <BreadCrumb />
      </div>

      <div className="flex justify-between">
        <ComboBox
          items={frameworks1}
          placeholder="Filter"
          icon={<MdFilterList />}
        />
        <ComboBox
          items={frameworks2}
          placeholder="Default Sorting"
          icon={<TbArrowsSort />}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
        {Array.from({ length: 20 }).map((_, i) => (
          <BookCard key={i} />
        ))}
      </div>
    </section>
  );
};

export default Books;
