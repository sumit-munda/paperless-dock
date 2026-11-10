import { useState, type FormEvent } from "react";
import { useAuth } from "../context/useAuth";

const getSafeAvatarUrl = (value: string): string => {
  try {
    const url = new URL(value);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href;
    }

    return "";
  } catch {
    return "";
  }
};

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!user) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const updatedUser = await updateProfile({
        name: name.trim(),
        avatar: avatar.trim() || null,
      });

      setName(updatedUser.name);
      setAvatar(updatedUser.avatar ?? "");
      setSuccess("Your profile has been updated successfully.");
    } catch (error) {
      if (error instanceof Error && error.message.includes("HTTP 400")) {
        setError("Please check your name and avatar URL.");
      } else if (error instanceof Error && error.message.includes("HTTP 401")) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError("Unable to update your profile. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="profile-page auth-page">
      <div className="auth-card">
        <h1>My Profile</h1>

        <p className="auth-description">
          Manage your personal information and profile appearance.
        </p>

        <div className="profile-avatar">
          {avatar.trim() ? (
            <img src={getSafeAvatarUrl(avatar)} alt={`${user.name}'s profile`} />
          ) : (
            <span aria-label="No profile image">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__field">
            <label htmlFor="profile-name">Full name</label>

            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={80}
              required
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="profile-email">Email address</label>

            <input
              id="profile-email"
              type="email"
              value={user.email}
              readOnly
            />

            <small>Your email address cannot be changed here.</small>
          </div>

          <div className="auth-form__field">
            <label htmlFor="profile-avatar">Avatar URL</label>

            <input
              id="profile-avatar"
              type="url"
              value={avatar}
              onChange={(event) => setAvatar(event.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />

            <small>
              Enter an image URL or leave it empty to remove your avatar.
            </small>
          </div>

          <div className="profile-account-info">
            <p>
              <strong>Account type:</strong> {user.role}
            </p>
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="profile-success" role="status">
              {success}
            </p>
          )}

          <button
            className="primary-button auth-submit"
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ProfilePage;
