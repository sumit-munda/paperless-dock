import express from "express";
import { PACKAGE_NAME } from "@paperless-dock/shared";

const app = express();

const PORT = 3000;

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    sharedPackage: PACKAGE_NAME,
  });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
