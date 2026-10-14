import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <section className="home-page" aria-labelledby="home-title">
      <p className="eyebrow">YOUR NEXT CHAPTERS STARTS HERE</p>

      <h1 id="home-title">
        Discover books. Build your library. Read anywhere.
      </h1>

      <p className="home-description">
        Explore digital books, discover your next great read, and keep your
        reading journey organized in one place.
      </p>

      <Link className="primary-button" to="/books">
        Explore Boooks
      </Link>
    </section>
  );
};

export default HomePage;
