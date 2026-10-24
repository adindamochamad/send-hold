import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isAppRoute = createRouteMatcher(["/app", "/app/(.*)"]);
const isSignIn = createRouteMatcher(["/app/sign-in"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (!isAppRoute(request)) {
    return;
  }
  if (isSignIn(request)) {
    return;
  }
  if (!(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/app/sign-in");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
