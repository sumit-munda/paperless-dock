import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getUserLibrary,
  type LibraryItem,
} from "../api/libraryApi";

export default function MyLibraryPage() {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadLibrary() {
      try {
        setLoading(true);
        setError("");

        const response = await getUserLibrary();

        if (isMounted) {
          setLibrary(response.library);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your library. Please try again.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadLibrary();

    return () => {
      isMounted = false;
    };
  }, []);

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }

  function getProgress(percentage: number) {
    return Math.min(100, Math.max(0, percentage));
  }

  if (loading) {
    return (
      <main className="library-page">
        <div className="library-loading">
          <p>Loading your library...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="library-page">
        <div className="library-error">
          <h2>Unable to load your library</h2>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="library-page">
      <section className="library-header">
        <div>
          <p className="library-eyebrow">YOUR PERSONAL COLLECTION</p>
          <h1>My Library</h1>
          <p className="library-description">
            Your purchased books, all in one place.
          </p>
        </div>

        <div className="library-count">
          <span>{library.length}</span>
          <span>{library.length === 1 ? "Book" : "Books"}</span>
        </div>
      </section>

      {library.length === 0 ? (
        <section className="library-empty">
          <div className="library-empty-icon">📚</div>
          <h2>Your library is waiting</h2>
          <p>
            Books you purchase will appear here. Discover something
            worth reading today.
          </p>
          <Link to="/books" className="library-browse-button">
            Explore Books
          </Link>
        </section>
      ) : (
        <section className="library-grid">
          {library.map((item) => {
            const progress = getProgress(
              item.readingProgress.percentage,
            );

            return (
              <article className="library-card" key={item.id}>
                <div className="library-card-cover">
                  {item.book.coverImage ? (
                    <img
                      src={item.book.coverImage}
                      alt={`Cover of ${item.book.title}`}
                    />
                  ) : (
                    <div className="library-cover-placeholder">
                      <span>📖</span>
                      <span>{item.book.title}</span>
                    </div>
                  )}
                </div>

                <div className="library-card-content">
                  <div className="library-card-top">
                    <span className="library-owned-badge">
                      Purchased
                    </span>
                    <span className="library-purchased-date">
                      {formatDate(item.purchasedAt)}
                    </span>
                  </div>

                  <h2>{item.book.title}</h2>

                  {item.book.authors.length > 0 && (
                    <p className="library-authors">
                      by {item.book.authors.join(", ")}
                    </p>
                  )}

                  {item.book.categories.length > 0 && (
                    <div className="library-categories">
                      {item.book.categories.map((category) => (
                        <span key={category}>{category}</span>
                      ))}
                    </div>
                  )}

                  <div className="library-progress">
                    <div className="library-progress-heading">
                      <span>Reading progress</span>
                      <span>{progress}%</span>
                    </div>

                    <div
                      className="library-progress-track"
                      role="progressbar"
                      aria-label={`Reading progress for ${item.book.title}`}
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="library-progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {item.readingProgress.lastReadAt && (
                      <p className="library-last-read">
                        Last read:{" "}
                        {formatDate(item.readingProgress.lastReadAt)}
                      </p>
                    )}
                  </div>

                  <div className="library-card-footer">
                    <span>
                      {item.book.pageCount
                        ? `${item.book.pageCount} pages`
                        : "Digital book"}
                    </span>
                    <span>
                      {item.book.language.toUpperCase()}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}