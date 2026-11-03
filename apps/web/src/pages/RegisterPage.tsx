import { useState, type FormEvent } from "react";
import { useAuth } from "../context/useAuth";
import { Link } from "react-router-dom";

const RegisterPage = () => {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (password.length < 12) {
      setError("Password must contain at least 12 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      setSuccess(true);
    } catch (error) {
      if (error instanceof Error && error.message.includes("HTTP 409")) {
        setError("An account with this email address already exists.");
      } else if (error instanceof Error && error.message.includes("HTTP 400")) {
        setError("Please check your details and try again.");
      } else {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to create your account. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <section className="auth-page" aria-labelledby="register-title">
        <div className="auth-card">
          <h1 id="register-title">Account created successfully!</h1>

          <p role="status">
            YOUR PAPERLESS DOCK account is ready. Log in to continue.
          </p>

          <Link className="primary-button" to="/login">
            Go to login
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page" aria-labelledby="register-title">
      <div className="auth-card">
        <p className="eyebrow">START YOUR READING JOURNEY</p>

        <h1 id="register-title">Create your account</h1>

        <p className="auth-description">
          Join PAPERLESS DOCK to build your personal reading library.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__field">
            <label htmlFor="register-name">Full name</label>

            <input
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="register-email">Email address</label>

            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="register-password">Password</label>

            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <small>Use at least 12 characters.</small>
          </div>

          <div className="auth-form__field">
            <label htmlFor="register-confirm-password">Confirm password</label>

            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              maxLength={128}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="primary-button auth-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  );
};

export default RegisterPage;
