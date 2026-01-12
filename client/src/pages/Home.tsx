import Footer from "@/components/header/Footer";
import Header from "@/components/header/Header";
import { Button } from "@/components/ui/button";
import { GiBookmark } from "react-icons/gi";
import { LuTelescope } from "react-icons/lu";

const Home = () => {
  return (
    <div>
      <Header />
      <div className="p-2 min-h-screen">
        <div className="flex flex-col gap-2 px-8 py-4 ">
          <h1 className="scorll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
            Discover, Own, and Read — Completely Paperless
          </h1>

          <p className="leading-7 not-first:my-2">
            A modern digital reading platform where users can explore, purchase,
            and read eBooks in one seamless experience. With an intuitive
            reader, progress tracking, and a clean interface, it brings
            paperless reading to life for today’s digital readers.
          </p>

          <div className="flex justify-center gap-2">
            <Button size={"sm"}>
              <LuTelescope />
              Explore Books
            </Button>
            <Button variant={"ghost"} size={"sm"}>
              <GiBookmark />
              Try a Book
            </Button>
          </div>
        </div>

        <div className="px-8">
          <img src="./src/assets/logo.png" alt="" />
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default Home;
