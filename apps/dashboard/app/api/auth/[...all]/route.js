import { auth } from "../../../../lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handlers = toNextJsHandler(auth);

export const GET = handlers.GET;

export const POST = async (req) => {
  const url = new URL(req.url);
  if (url.pathname.endsWith("/forget-password") || url.pathname.endsWith("/forgot-password")) {
    const newUrl = new URL(req.url);
    newUrl.pathname = newUrl.pathname.replace(/\/(forget|forgot)-password$/, "/request-password-reset");
    const newReq = new Request(newUrl.toString(), {
      method: req.method,
      headers: req.headers,
      body: req.body,
      duplex: "half",
    });
    return handlers.POST(newReq);
  }
  return handlers.POST(req);
};
