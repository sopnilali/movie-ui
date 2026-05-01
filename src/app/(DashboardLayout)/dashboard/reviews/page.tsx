"use client";

import React from "react";
import UserReviews from "@/components/Dashboardlayout/Reviews/UserReviews";
import ManageReview from "@/components/Dashboardlayout/Review/ManageReview";
import { useAppSelector } from "@/components/redux/hooks";
import { selectCurrentToken } from "@/components/redux/features/auth/authSlice";
import { verifyToken } from "@/utils/verifyToken";

const ReviewsPage = () => {
  const token = useAppSelector(selectCurrentToken);
  const user = token ? (verifyToken(token) as { role?: "ADMIN" | "USER" }) : null;
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">
        {isAdmin ? "Review Management" : "My Movie Reviews"}
      </h1>
      {isAdmin ? <ManageReview /> : <UserReviews />}
    </div>
  );
};

export default ReviewsPage;
