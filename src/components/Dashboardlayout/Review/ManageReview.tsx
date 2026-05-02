"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetAllReviewQuery,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} from "@/components/redux/features/review/reviewApi";
import { MdDeleteOutline } from "react-icons/md";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { Review, ReviewStatus } from "@/components/types/review";

const ManageReview = () => {
  const { data: reviews, isLoading, error } = useGetAllReviewQuery(undefined);
  const [updateReview] = useUpdateReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | ReviewStatus>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const handleStatusChange = async (
    reviewId: string,
    newStatus: ReviewStatus
  ) => {
    try {
      await updateReview({
        id: reviewId,
        status: newStatus,
      }).unwrap();
      toast.success("Review status updated successfully");
    } catch (error: any) {
      // Handle specific error message from API
      const errorMessage =
        error?.data?.message || "Failed to update review status";
      toast.error(errorMessage);
      // console.error("Error updating review:", error);
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      await deleteReview(reviewId).unwrap();
      toast.success("Review deleted successfully");
      setIsDeleteModalOpen(false);
      setReviewToDelete(null);
    } catch (error: any) {
      const errorMessage = error?.data?.message || "Failed to delete review";
      toast.error(errorMessage);
      // console.error("Error deleting review:", error);
    }
  };

  const openDeleteModal = (review: Review) => {
    setReviewToDelete(review);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setReviewToDelete(null);
  };

  const getStatusColor = (status: ReviewStatus) => {
    switch (status) {
      case "PUBLISHED":
        return "border-green-500/50 text-green-400";
      case "PENDING":
        return "border-yellow-500/50 text-yellow-400";
      default:
        return "border-gray-500/50 text-gray-400";
    }
  };

  const renderStatusOptions = () => {
    return (
      <>
        <option value="PUBLISHED" className="bg-[#000a3a] text-green-400">
          Published
        </option>
        <option value="PENDING" className="bg-[#000a3a] text-yellow-400">
          Pending
        </option>
      </>
    );
  };

  // Handle error state
  if (error) {
    // console.error("Error fetching reviews:", error);
    toast.error("Failed to fetch reviews. Please try again later.");
    return (
      <div className="min-h-screen bg-[#00031b] p-2 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">
            Error Loading Reviews
          </h2>
          <p className="text-gray-400">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const reviewsList = reviews?.data || [];
  const statusFilteredReviews =
    statusFilter === "ALL"
      ? reviewsList
      : reviewsList.filter((review: Review) => review.status === statusFilter);
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredReviews = normalizedSearchTerm
    ? statusFilteredReviews.filter((review: Review) => {
        const reviewerName = review.user?.name?.toLowerCase() || "";
        const reviewerEmail = review.user?.email?.toLowerCase() || "";
        const contentTitle = review.content?.title?.toLowerCase() || "";
        const reviewText = review.reviewText?.toLowerCase() || "";

        return (
          reviewerName.includes(normalizedSearchTerm) ||
          reviewerEmail.includes(normalizedSearchTerm) ||
          contentTitle.includes(normalizedSearchTerm) ||
          reviewText.includes(normalizedSearchTerm)
        );
      })
    : statusFilteredReviews;

  // Calculate pagination
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReviews = filteredReviews.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="min-h-screen bg-[#00031b]">
      <div className="max-w-full mx-auto">
        <div className="mb-8 rounded-2xl border border-white/10 bg-gradient-to-r from-[#0b1444] to-[#060a2d] p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.22em] text-blue-300/80">
                Admin Panel
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-blue-300 via-cyan-300 to-purple-300 bg-clip-text text-transparent">
                Review Management
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                Moderate reviews, publish pending items, and remove abusive
                feedback.
              </p>
            </div>
            <div className="flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
              {(["ALL", "PENDING", "PUBLISHED"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                  className={`rounded-lg px-3 py-2 text-xs md:text-sm transition-colors ${
                    statusFilter === status
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                      : "text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-gray-400">Total Reviews</p>
              <p className="text-2xl font-semibold text-white">
                {reviewsList.length}
              </p>
            </div>
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
              <p className="text-sm text-yellow-200">Pending</p>
              <p className="text-2xl font-semibold text-yellow-300">
                {
                  reviewsList.filter((item: Review) => item.status === "PENDING")
                    .length
                }
              </p>
            </div>
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
              <p className="text-sm text-green-200">Published</p>
              <p className="text-2xl font-semibold text-green-300">
                {
                  reviewsList.filter(
                    (item: Review) => item.status === "PUBLISHED"
                  ).length
                }
              </p>
            </div>
          </div>

          <div className="mt-4">
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by reviewer, email, content, or review text..."
              className="h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-white text-5xl font-bold text-center">
            <LoadingSpinner />
          </p>
        ) : filteredReviews.length > 0 ? (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {currentReviews.map((review: Review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#0a123f] to-[#060a2d] p-5"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Reviewer</p>
                      <p className="font-semibold text-white">{review.user.name}</p>
                      <p className="text-xs text-gray-400">{review.user.email}</p>
                    </div>
                    <button
                      className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20"
                      onClick={() => openDeleteModal(review)}
                    >
                      <MdDeleteOutline className="text-xl" />
                    </button>
                  </div>

                  <div className="mb-3 rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="text-xs text-gray-400">Content</p>
                    <p className="font-medium text-white">{review.content.title}</p>
                  </div>

                  <p className="mb-4 text-sm leading-relaxed text-gray-200 line-clamp-4">
                    {review.reviewText}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1">
                      <span className="text-yellow-400 text-lg">★</span>
                      <span className="text-sm text-yellow-200">
                        {review.rating}/10
                      </span>
                    </div>

                    {review.status === "PENDING" ? (
                      <select
                        value={review.status}
                        onChange={(e) =>
                          handleStatusChange(
                            review.id,
                            e.target.value as ReviewStatus
                          )
                        }
                        className={`px-3 py-1 rounded-full text-sm bg-transparent border ${getStatusColor(
                          review.status
                        )} focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                      >
                        {renderStatusOptions()}
                      </select>
                    ) : (
                      <p
                        className={`text-sm rounded-full bg-transparent border ${getStatusColor(
                          review.status
                        )} w-fit px-3 py-1 text-center`}
                      >
                        PUBLISHED
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-[#000a3a] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#001366] transition-colors"
              >
                Previous
              </button>

              <div className="flex gap-2">
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => handlePageChange(index + 1)}
                    className={`px-4 py-2 rounded-lg ${currentPage === index + 1
                        ? "bg-gradient-to-r from-blue-500 to-purple-400"
                        : "bg-[#000a3a] text-white hover:bg-[#001366]"
                      } transition-colors`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-[#000a3a] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#001366] transition-colors"
              >
                Next
              </button>
            </div>
          </>
        ) : <div className="text-center py-8">
          <p className="text-gray-400 text-lg">No reviews found for this filter</p>
        </div>}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {isDeleteModalOpen && reviewToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-[#000a3a] p-6 rounded-xl border border-[#1a2d6d] max-w-md w-full mx-4"
              >
                <motion.h3
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl font-semibold text-white mb-4"
                >
                  Confirm Delete
                </motion.h3>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-300 mb-6"
                >
                  Are you sure you want to delete this review? This action
                  cannot be undone.
                </motion.p>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-end gap-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={closeDeleteModal}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(reviewToDelete.id)}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    Delete
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ManageReview;
