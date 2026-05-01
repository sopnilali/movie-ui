import { verifyToken } from "@/utils/verifyToken";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

type Role = keyof typeof roleBasedPrivateRoutes;

const authRoutes = ["/login", "/register"];

const roleBasedPrivateRoutes = {
  USER: [
    /^\/dashboard$/,
    /^\/dashboard\/profile/,
    /^\/dashboard\/watchlist/,
    /^\/dashboard\/purchasehistory/,
    /^\/dashboard\/purchase-history/,
    /^\/dashboard\/reviews/,
  ],
  ADMIN: [
    /^\/dashboard$/,
    /^\/dashboard\/profile/,
    /^\/dashboard\/content/,
    /^\/dashboard\/users/,
    /^\/dashboard\/reviews/,
    /^\/dashboard\/platformGenre/,
    /^\/dashboard\/discount/,
    /^\/dashboard\/subscribers/,
  ],
};

// const roleBasedPrivateRoutes = {
//   USER: [/^\/dashboard/, /^\/profile/],
//   ADMIN: [/^\/dashboard/, /^\/profile/],
// };

export const middleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  let userInfo = null;

  if (accessToken) {
    userInfo = verifyToken(accessToken);
  }

  if (!userInfo) {
    if (authRoutes.includes(pathname)) {
      return NextResponse.next();
    } else {
      return NextResponse.redirect(
        new URL(`/login?redirectPath=${pathname}`, request.url)
      );
    }
  }

  const role = userInfo?.role as Role;
  const allowedRoutes = roleBasedPrivateRoutes[role];

  if (allowedRoutes && allowedRoutes.some((route) => pathname.match(route))) {
    return NextResponse.next();
  }
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set("accessToken", "", { maxAge: 0 });
  return response;
};

export const config = {
  matcher: [
    "/login",
    "/register",
    "/dashboard/:path*",
    "/profile",
    "/profile/:path*",
  ],
};

// export const config = {
//   matcher: ["/profile", "/dashboard", "/dashboard/:page*"],
// };
