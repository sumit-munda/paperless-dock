import { BreadCrumb } from "@/components/common/BreadCrumb";

const Books = () => {
  return (
    <section aria-labelledby="books-page" className="px-6 py-4">
      <div className="flex justify-between items-end my-4">
        <h1 className="scroll-m-20 text-4xl sm:text-5xl font-extrabold tracking-tight text-balance">
          Books
        </h1>
        <BreadCrumb />
      </div>
     
    </section>
  );
};

export default Books;
