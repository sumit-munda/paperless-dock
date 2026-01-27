import { Button } from "../ui/button";

const Logo = () => {
  return (
    <Button variant="unstyled" size="sm">
      <img src="./src/assets/logo.png" alt="logo" className="w-8" />
      <span className="text-start text-[.6rem]/2.5 ">
        The <br /> Paperless <br /> Dock
      </span>
    </Button>
  );
};

export default Logo;
