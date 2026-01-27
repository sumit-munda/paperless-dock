import Footer from "@/components/navigation/Footer";
import Header from "@/components/navigation/Header";
import { Button } from "@/components/ui/button";
import { GiBookmark } from "react-icons/gi";
import { LuTelescope } from "react-icons/lu";

const Home = () => {
  return (
    <div>
      <Header />
      <section className="w-full">
        <div
          className="
      mx-auto
      max-w-6xl
      px-4 sm:px-6 lg:px-8
      pt-16 sm:pt-20 lg:pt-28
      pb-16
      grid
      gap-10
      lg:grid-cols-2
      items-center
    "
        >
          {/* Text Content */}
          <div className="flex flex-col gap-4 text-center lg:text-left">
            <h1 className="scroll-m-20 text-4xl sm:text-5xl font-extrabold tracking-tight text-balance">
              Discover, Own, and Read — Completely Paperless
            </h1>

            <p className="max-w-xl mx-auto lg:mx-0 leading-7 text-muted-foreground">
              A modern digital reading platform where users can explore,
              purchase, and read eBooks in one seamless experience. With an
              intuitive reader, progress tracking, and a clean interface, it
              brings paperless reading to life for today’s digital readers.
            </p>

            <div className="flex justify-center lg:justify-start gap-3 pt-2">
              <Button size="sm">
                <LuTelescope />
                Explore Books
              </Button>
              <Button variant="ghost" size="sm">
                <GiBookmark />
                Try a Book
              </Button>
            </div>
          </div>

          {/* Image */}
          <div className="flex justify-center lg:justify-end">
            <img
              src="/src/assets/logo.png"
              alt="Hero illustration"
              className="w-48 sm:w-64 lg:w-72"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
