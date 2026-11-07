import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Document, Page } from "react-pdf";

import "../lib/pdfWorker";

import { getBookPdfUrl } from "../api/libraryApi";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import PdfErrorBoundary from "../components/reader/PdfErrorBoundary";

export default function BookReaderPage() {
  const { bookId } = useParams<{ bookId: string }>();

  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  if (!bookId) {
    return (
      <main className="reader-page">
        <div className="reader-error">
          <h2>Book not found</h2>
          <p>The requested book could not be identified.</p>
          <Link to="/library">Back to My Library</Link>
        </div>
      </main>
    );
  }

  function handleDocumentLoad({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
    setError("");
  }

  function handleDocumentError(error: Error) {
    setLoading(false);

    const status = "status" in error ? error.status : undefined;

    if (status === 404) {
      setError(
        "You don't have access to this book, or its reading content is unavailable.",
      );
      return;
    }

    if (status === 401) {
      setError(
        "Your session may have expired. Please log in again to continue reading.",
      );
      return;
    }

    setError(
      "Unable to load this book. Please check your connection and try again.",
    );
  }

  function retryLoading() {
    setError("");
    setLoading(true);
    setNumPages(0);
    setPageNumber(1);
    setRetryCount((current) => current + 1);
  }

  function goToPreviousPage() {
    setPageNumber((current) => Math.max(1, current - 1));
  }

  function goToNextPage() {
    setPageNumber((current) => Math.min(numPages, current + 1));
  }

  function zoomIn() {
    setScale((current) => Math.min(2, current + 0.2));
  }

  function zoomOut() {
    setScale((current) => Math.max(0.6, current - 0.2));
  }

  return (
    <main className="reader-page">
      <header className="reader-header">
        <div>
          <Link to="/library" className="reader-back-link">
            ← Back to My Library
          </Link>

          <h1>Book Reader</h1>
        </div>

        {!error && numPages > 0 && (
          <div className="reader-controls">
            <button
              type="button"
              onClick={zoomOut}
              disabled={scale <= 0.6}
              aria-label="Zoom out"
            >
              −
            </button>

            <span>{Math.round(scale * 100)}%</span>

            <button
              type="button"
              onClick={zoomIn}
              disabled={scale >= 2}
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        )}
      </header>

      {loading && (
        <div className="reader-loading">
          <p>Loading your book...</p>
        </div>
      )}

      {error ? (
        <div className="reader-error">
          <h2>Unable to open book</h2>
          <p>{error}</p>

          <button type="button" onClick={retryLoading}>
            Try Again
          </button>

          <Link to="/library">Return to My Library</Link>
        </div>
      ) : (
        <>
          <div className="reader-document">
            <PdfErrorBoundary key={retryCount} onError={handleDocumentError}>
              <Document
                key={retryCount}
                file={getBookPdfUrl(bookId)}
                options={{
                  withCredentials: true,
                }}
                onLoadSuccess={handleDocumentLoad}
                onLoadError={handleDocumentError}
                onSourceError={handleDocumentError}
                loading={null}
                error={null}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer
                  renderAnnotationLayer
                />
              </Document>
            </PdfErrorBoundary>
          </div>

          {!loading && numPages > 0 && (
            <nav className="reader-pagination" aria-label="PDF page navigation">
              <button
                type="button"
                onClick={goToPreviousPage}
                disabled={pageNumber <= 1}
              >
                Previous
              </button>

              <span>
                Page {pageNumber} of {numPages}
              </span>

              <button
                type="button"
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
