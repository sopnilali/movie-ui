// services/baseApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_API ||
  process.env.NEXT_PUBLIC_BASE_API_DEV ||
  "http://localhost:5000";

const baseQuery = fetchBaseQuery({
  baseUrl: `${API_BASE_URL.replace(/\/$/, "")}/api`,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set("authorization", `${token}`);
    }

    return headers;
  },
});

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQuery,
  tagTypes: [
    "content",
    "user",
    "review",
    "genres",
    "comment",
    "platforms",
    "payment",
    "likes",
    "admin",
    "discounts",
 
    "contactUs",
    "coupon",
    "subscribers",
 
  ],
  endpoints: () => ({}),
});
