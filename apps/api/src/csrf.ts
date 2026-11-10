import { csrfSync } from "csrf-sync";

const { generateToken, csrfSynchronisedProtection, invalidCsrfTokenError } =
  csrfSync();

export { generateToken, csrfSynchronisedProtection, invalidCsrfTokenError };
