import { next } from "@vercel/functions";
import { verifySession } from "./lib/model-studio-auth.js";

export default async function proxy(request) {
  const url = new URL(request.url);
  if (url.pathname === "/login.html" || url.pathname === "/login.js" ||
      url.pathname === "/api/model-studio-auth") {
    return next();
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const sessionCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("model_studio_session="));
  const token = sessionCookie?.slice("model_studio_session=".length) || "";

  if (await verifySession(token, process.env.MODEL_STUDIO_SESSION_SECRET)) {
    return next();
  }

  const loginUrl = new URL("/login.html", url.origin);
  loginUrl.searchParams.set("next", url.pathname + url.search);
  return Response.redirect(loginUrl, 302);
}
