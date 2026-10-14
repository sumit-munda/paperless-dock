import { Link } from "react-router-dom";
import type { Book } from "../data/books";

interface BookCardProps {
  book: Book;
}

const BookCard = ({ book }: BookCardProps) => {
  return (
    <article className="book-card">
      <Link
        className="book-card__link"
        to={`/books/${book.id}`}
        aria-label={`View details for ${book.title}`}
      >
        <img
          className="book-card__cover"
          src={book.coverImage}
          alt={`Cover of ${book.title}`}
          loading="lazy"
        />

        <div className="book-card__content">
          <p className="book-card__category">{book.category}</p>

          <h2 className="book-card__title">{book.title}</h2>

          <p className="book-card__author">by {book.author}</p>

          <p
            className="book-card__rating"
            aria-label={`Rating: ${book.rating} out of 5`}
          >
            <span aria-hidden="true">★</span> {book.rating.toFixed(1)} / 5
          </p>

          <p className="book-card__price">
            {book.price.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </Link>
    </article>
  );
};

export default BookCard;
