import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  onClick?: () => void;
}

// Logo component
// Clickable, accessible, navigates to home ("/")

const Logo = ({ className, onClick }: LogoProps) => {

  return (
    <Button
      variant="unstyled"
      size="sm"
      onClick={onClick}
      className={cn("flex items-center gap-2 focus:outline-none", className)}
    >
      <img
        src="./src/assets/logo.png"
        alt="Paperless Dock Logo"
        className="w-8"
      />
      <span className="text-start text-[.6rem]/2.5">
        <span className="block">The</span>
        <span className="block">Paperless</span>
        <span className="block">Dock</span>
      </span>
    </Button>
  );
};

export default Logo;
