import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

// Logo component
// Clickable, accessible, navigates to home ("/")

const Logo = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="unstyled"
      size="sm"
      onClick={() => navigate("/")}
      className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <img
        src="./src/assets/logo.png"
        alt="Paperless Dock Logo"
        className="w-8"
      />
      <span className="text-xs sm:text-sm font-bold leading-tight">
        The Paperless Dock
      </span>
    </Button>
  );
};

export default Logo;
