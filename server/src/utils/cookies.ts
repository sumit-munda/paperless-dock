import { CookieOptions, Response } from "express";

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  const isProd = process.env.NODE_ENV === "production";

  const options: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 15 * 60 * 1000,
    path: "/",
    ...(isProd ? {} : { domain: "localhost" }),
  };

  res.cookie("access_token", accessToken, options);
  res.cookie("refresh_token", refreshToken, options);
};

export const clearAuthCookies = (res: Response) => {
  const options: CookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    domain: "localhost",
  };

  res.clearCookie("access_token", options);
  res.clearCookie("refresh_token", options);
};
