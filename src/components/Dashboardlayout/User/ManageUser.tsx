"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { MdDeleteOutline } from "react-icons/md";
import { FaPen } from "react-icons/fa6";
import {
  useGetAllUserQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
} from "@/components/redux/features/user/userApi";
import UpdateUserModal from "@/components/modals/UpdateUserModal";
import LoadingSpinner from "@/components/ui/loading-spinner";

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: "USER" | "ADMIN";
  contactNumber: string;
  status: "ACTIVE" | "INACTIVE";
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
}

const ManageUser = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Add User Modal States
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    register: registerAddUser,
    handleSubmit: handleAddUserSubmit,
    reset: resetAddUser,
    formState: { errors: addUserErrors },
  } = useForm<User>();

  const { data: users, isLoading } = useGetAllUserQuery([
    { name: "page", value: currentPage },
    { name: "limit", value: itemsPerPage },
  ]);

  const [createUser] = useCreateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [updateUser] = useUpdateUserMutation();

  const totalPages = Math.ceil((users?.meta?.total || 0) / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Add User Modal Functions
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setPreviewImage(null);
    setProfilePhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmitAddUser: SubmitHandler<User> = async (data) => {
    const toastId = toast.loading("Adding User....", { duration: 2000 });

    if (!profilePhoto) {
      toast.error("Please provide a profile picture", {
        id: toastId,
      });
      return;
    }

    if (!data.password) {
      toast.error("Password is required", {
        id: toastId,
      });
      return;
    }

    const userData = {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      contactNumber: data.contactNumber,
    };

    const formData = new FormData();
    formData.append("data", JSON.stringify(userData));
    formData.append("file", profilePhoto);

    try {
      const res = await createUser(formData);

      if ("error" in res && res.error) {
        const errorMessage =
          (res.error as any)?.data?.message || "An error occurred";
        toast.error(errorMessage, { id: toastId });
      } else {
        toast.success("User added successfully!", { id: toastId });
        setIsModalOpen(false);
        resetAddUser();
        clearImage();
      }
    } catch (error: any) {
      const errorMessage = error.data?.message || "Failed to add user";
      toast.error(errorMessage, {
        id: toastId,
        duration: 2000,
      });
    }
  };

  const handleUserDelete = async (userId: string) => {
    const toastId = toast.loading("Deleting User...", { duration: 2000 });

    try {
      const res = await deleteUser(userId).unwrap();
      toast.success("User deleted successfully!", { id: toastId });
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user", { id: toastId });
    }
  };

  const handleRoleUpdate = async (
    userId: string,
    newRole: "USER" | "ADMIN"
  ) => {
    const toastId = toast.loading("Updating User Role...", { duration: 2000 });

    try {
      const res = await updateUser({
        id: userId,
        role: newRole,
      }).unwrap();
      toast.success("User role updated successfully!", { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "Failed to update user role", {
        id: toastId,
      });
    }
  };

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  return (
    <div className="min-h-screen bg-[#00031b]">
      <div className="max-w-full mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="md:text-3xl text-xl font-bold text-white">
            User Management
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 text-sm lg:text-base lg:px-6 py-2 rounded-lg transition-all"
          >
            Add User
          </button>
        </div>

        {/* User Table */}
        {isLoading ? (
          <p className="text-white text-5xl font-bold text-center">
            <LoadingSpinner />
          </p>
        ) : (
          <div className="rounded-xl border border-[#1a2d6d] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#000a3a]">
                  <tr>
                    <th className="px-6 py-4 text-left">Name</th>
                    <th className="px-6 py-4 text-left">Email</th>
                    <th className="px-6 py-4 text-left">Contact Number</th>
                    <th className="px-6 py-4 text-left">Role</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.data?.map((user: User) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-t border-[#1a2d6d] hover:bg-[#000a3a]/50 transition-colors"
                    >
                      <td className="px-6 py-4">{user.name}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">{user.contactNumber}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm border ${
                            user.role === "ADMIN"
                              ? "border-purple-500/50 text-purple-400"
                              : "border-blue-500/50 text-blue-400"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm border ${
                            user.status === "ACTIVE"
                              ? "border-green-500/50 text-green-400"
                              : "border-red-500/50 text-red-400"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-2xl">
                        <div className="flex gap-4">
                          <MdDeleteOutline
                            className="cursor-pointer hover:text-red-500  text-2xl transition-colors "
                            onClick={() => openDeleteModal(user)}
                          />
                          <FaPen
                            className="cursor-pointer hover:text-blue-500  text-xl transition-colors"
                            onClick={() => {
                              setUpdateModalOpen(true);
                              setUser(user);
                            }}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-2 py-4 bg-[#000a3a]">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="lg:px-4 px-3 py-2 text-sm lg:text-base rounded-lg bg-[#1a2d6d] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4  py-2 text-sm lg:text-base rounded-lg ${
                      currentPage === page
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        : "bg-[#1a2d6d] text-white"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="lg:px-4 px-3 py-2 text-sm lg:text-base rounded-lg bg-[#1a2d6d] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {isDeleteModalOpen && userToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 "
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
                  Are you sure you want to delete this user? This action cannot
                  be undone.
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
                    className="px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleUserDelete(userToDelete.id)}
                    className=" hover:bg-red-600 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Delete
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Update User Modal */}
        <UpdateUserModal
          isUpdateModalOpen={isUpdateModalOpen}
          setUpdateModalOpen={setUpdateModalOpen}
          user={user}
        />

        {/* Add User Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md p-3 md:p-6"
            >
              <motion.div
                initial={{ scale: 0.96, y: 18 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed top-1/2 left-1/2 w-full max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0b1444] to-[#060a2d] shadow-[0_25px_80px_rgba(0,0,0,0.55)]"
              >
                <form
                  onSubmit={handleAddUserSubmit(onSubmitAddUser)}
                  className="max-h-[90vh] overflow-y-auto p-5 md:p-8 space-y-6"
                >
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-[0.22em] text-blue-300/80">
                        User Management
                      </p>
                      <h2 className="text-xl md:text-3xl font-semibold bg-gradient-to-r from-blue-300 via-cyan-300 to-purple-300 bg-clip-text text-transparent">
                        Add New User
                      </h2>
                    </div>
                    <p className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
                      Professional mode
                    </p>
                  </div>

                  {/* Profile Photo Upload */}
                  <div className="rounded-2xl border border-white/10 bg-[#070d33]/80 p-5 md:p-6">
                    <h3 className="mb-1 text-lg font-semibold text-white">
                      Profile Photo
                    </h3>
                    <p className="mb-4 text-sm text-gray-400">
                      Upload a clear photo for this user profile.
                    </p>
                    <div className="rounded-xl border border-dashed border-blue-400/30 bg-gradient-to-b from-[#00031b] to-[#050a2a] p-4 text-center">
                      {previewImage ? (
                        <div className="relative group">
                          <img
                            src={previewImage}
                            alt="Preview"
                            className="h-52 w-full rounded-lg border border-white/10 object-cover"
                          />
                          <p className="mt-3 text-xs text-gray-400">
                            Preview ready. You can replace this image anytime.
                          </p>
                          <button
                            type="button"
                            onClick={clearImage}
                            className="absolute right-2 top-2 rounded-full bg-red-500/85 px-2 py-1 text-sm text-white hover:bg-red-600 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4 py-4">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10">
                            <svg
                              className="h-6 w-6 text-blue-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.8"
                                d="M3 15.75V18a2 2 0 002 2h14a2 2 0 002-2v-2.25M7.5 9L12 4.5m0 0L16.5 9M12 4.5V15"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">
                              Drag and drop image here
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              PNG, JPG up to 5MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-lg border border-purple-400/30 bg-purple-600/20 px-6 py-3 text-purple-200 hover:bg-purple-600/30 transition-colors"
                          >
                            Browse Files
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#070d33]/80 p-5 md:p-6">
                    <h3 className="mb-1 text-lg font-semibold text-white">
                      Basic Information
                    </h3>
                    <p className="mb-4 text-sm text-gray-400">
                      Main identity and account credentials.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Row */}
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-wide text-gray-300">
                        Full Name
                      </label>
                      <input
                        {...registerAddUser("name", { required: true })}
                        placeholder="Full Name"
                        className="h-11 w-full rounded-lg border border-white/15 bg-[#00031b] px-4 text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                      {addUserErrors.name && (
                        <p className="mt-1 text-sm text-red-400">Name is required!</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-wide text-gray-300">
                        Email
                      </label>
                      <input
                        {...registerAddUser("email", { required: true })}
                        type="email"
                        placeholder="Email"
                        className="h-11 w-full rounded-lg border border-white/15 bg-[#00031b] px-4 text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                      {addUserErrors.email && (
                        <p className="mt-1 text-sm text-red-400">Email is required!</p>
                      )}
                    </div>

                    {/* Second Row */}
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-wide text-gray-300">
                        Password
                      </label>
                      <input
                        {...registerAddUser("password", { required: true })}
                        type="password"
                        placeholder="Set temporary password"
                        className="h-11 w-full rounded-lg border border-white/15 bg-[#00031b] px-4 text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        This field is required for new account creation.
                      </p>
                      {addUserErrors.password && (
                        <p className="mt-1 text-sm text-red-400">Password is required!</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-wide text-gray-300">
                        Contact Number
                      </label>
                      <input
                        {...registerAddUser("contactNumber", {
                          required: true,
                        })}
                        placeholder="Contact Number"
                        className="h-11 w-full rounded-lg border border-white/15 bg-[#00031b] px-4 text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                      {addUserErrors.contactNumber && (
                        <p className="mt-1 text-sm text-red-400">
                          Contact Number is required!
                        </p>
                      )}
                    </div>

                    {/* Third Row */}
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-wide text-gray-300">
                        Role
                      </label>
                      <select
                        {...registerAddUser("role", { required: true })}
                        className="h-11 w-full rounded-lg border border-white/15 bg-[#00031b] px-4 text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">Select Role</option>
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      {addUserErrors.role && (
                        <p className="mt-1 text-sm text-red-400">Role is required!</p>
                      )}
                    </div>
                  </div>
                  </div>

                  {/* Form Buttons */}
                  <div className="sticky bottom-0 mt-8 flex justify-end gap-3 border-t border-white/10 bg-gradient-to-t from-[#060a2d] to-transparent pt-5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetAddUser();
                        clearImage();
                      }}
                      className="rounded-lg border border-white/15 bg-white/5 px-5 py-2 text-sm md:text-base text-white hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 px-5 py-2 text-sm md:text-base font-medium text-white shadow-lg shadow-blue-500/20 hover:opacity-90 transition-opacity"
                    >
                      Add User
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ManageUser;
