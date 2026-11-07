import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

export default function RouteErrorPage() {
  const error = useRouteError();

  let title = "Something went wrong";
  let message = "An unexpected error occurred. Please try again.";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Page not found";
      message = "The page you're looking for doesn't exist.";
    } else if (error.status === 401) {
      title = "Authentication required";
      message = "Please log in to continue.";
    }
  }

  return (
    <main className="reader-page">
      <div className="reader-error">
        <h2>{title}</h2>
        <p>{message}</p>
        <Link to="/library">Return to My Library</Link>
        <Link to="/">Go to Homepage</Link>
      </div>
    </main>
  );
}
