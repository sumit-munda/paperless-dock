import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// pages/NotFound.tsx
const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      {/* Error code */}
      <h1 className="text-5xl font-bold tracking-tight">404</h1>
      
      {/* Message */}
      <p className="text-sm text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>

      {/* Action */}
      <Button onClick={() => navigate("/")}>Go back home</Button>
    </div>
  );
};

export default NotFound;
