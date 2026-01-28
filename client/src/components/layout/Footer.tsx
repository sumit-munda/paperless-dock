const Footer = () => {
  return (
    <footer className="px-4 py-2">
      <p className="text-center text-[0.65rem] leading-6 text-muted-foreground">
        The source code is available on
        <a
          href="https://github.com/sumit-munda/paperless-dock"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          GitHub
        </a>
        .
      </p>
    </footer>
  );
};

export default Footer;
