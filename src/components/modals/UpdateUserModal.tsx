import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  useChangePasswordMutation,
  useGetUserQuery,
  useUpdateUserMutation,
} from "@/components/redux/features/user/userApi";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  contactNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateUserModalProps {
  isUpdateModalOpen: boolean;
  setUpdateModalOpen: (isOpen: boolean) => void;
  user: User | null;
}

type UpdateUserFormValues = Pick<
  User,
  "name" | "email" | "role" | "contactNumber" | "status"
>;

interface ChangePasswordFormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UpdateUserModal = ({
  isUpdateModalOpen,
  setUpdateModalOpen,
  user,
}: UpdateUserModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UpdateUserFormValues>();
  const {
    register: registerPassword,
    reset: resetPasswordForm,
    watch,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordFormValues>();

  const [updateUser] = useUpdateUserMutation();
  const [changePassword] = useChangePasswordMutation();
  const { data: userDetails, isFetching: isFetchingUser } = useGetUserQuery(
    user?.id,
    {
      skip: !isUpdateModalOpen || !user?.id,
    }
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set initial form values when user data is available
  useEffect(() => {
    const currentUser = userDetails?.data || user;

    if (currentUser) {
      setValue("name", currentUser.name);
      setValue("email", currentUser.email);
      setValue("role", currentUser.role);
      setValue("contactNumber", currentUser.contactNumber);
      setValue("status", currentUser.status);
      setPreviewImage(currentUser.profilePhoto || null);
      setProfilePhoto(null);
    }
  }, [userDetails, user, setValue]);

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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data: UpdateUserFormValues) => {
    const toastId = toast.loading("Updating User...", { duration: 2000 });

    try {
      const userData = {
        name: data.name,
        email: data.email,
        role: data.role,
        contactNumber: data.contactNumber,
        status: data.status,
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(userData));
      
      if (profilePhoto) {
        formData.append("file", profilePhoto);
      }

      const res = await updateUser({
        id: user?.id || "",
        data: formData,
      }).unwrap();

      const oldPassword = watch("oldPassword");
      const newPassword = watch("newPassword");
      const confirmPassword = watch("confirmPassword");

      if (oldPassword || newPassword || confirmPassword) {
        if (!oldPassword || !newPassword || !confirmPassword) {
          toast.error("To change password, fill all password fields.", {
            id: toastId,
          });
          return;
        }

        if (newPassword !== confirmPassword) {
          toast.error("Confirm password does not match.", {
            id: toastId,
          });
          return;
        }

        await changePassword({
          oldPassword,
          newPassword,
        }).unwrap();
      }

      toast.success("User updated successfully!", { id: toastId });
      setUpdateModalOpen(false);
      reset();
      resetPasswordForm();
      clearImage();
    } catch (error: any) {
      toast.error(
        error?.data?.message || error?.message || "Failed to update user",
        { id: toastId }
      );
    }
  };

  if (!isUpdateModalOpen || !user) return null;

  return (
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
        <div className="max-h-[90vh] overflow-y-auto p-5 md:p-8">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.22em] text-blue-300/80">
                User Management
              </p>
              <h2 className="text-xl font-semibold md:text-3xl bg-gradient-to-r from-blue-300 via-cyan-300 to-purple-300 bg-clip-text text-transparent">
              Edit User Profile
              </h2>
            </div>
            <p className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
              {isFetchingUser ? "Refreshing data..." : "Professional mode"}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#070d33]/80 p-5 md:p-6">
              <h3 className="mb-1 text-lg font-semibold text-white">
                Profile Photo
              </h3>
              <p className="mb-4 text-sm text-gray-400">
                Upload a clear profile photo for better identity.
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
                Core identity details used across the platform.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wide text-gray-300">
                    Full Name
                  </label>
                  <input
                    {...register("name", { required: true })}
                    placeholder="Name"
                    className="h-11 w-full rounded-lg border border-white/15 bg-[#00031b] px-4 text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">Name is required</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wide text-gray-300">
                    Email Address
                  </label>
                  <input
                    {...register("email", { required: true })}
                    type="email"
                    placeholder="Email"
                    className="h-11 w-full rounded-lg border border-white/15 bg-[#00031b] px-4 text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">Email is required</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#070d33]/80 p-5 md:p-6">
              <h3 className="mb-1 text-lg font-semibold text-white">
                Account Settings
              </h3>
              <p className="mb-4 text-sm text-gray-400">
                Configure access level and account availability.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wide text-gray-300">
                    Contact Number
                  </label>
                  <input
                    {...register("contactNumber", { required: true })}
                    placeholder="Contact Number"
                    className="h-11 w-full rounded-lg border border-white/15 bg-[#00031b] px-4 text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {errors.contactNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      Contact number is required
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wide text-gray-300">Role</label>
                  <select
                    {...register("role", { required: true })}
                    className="h-11 w-full rounded-lg border border-white/15 bg-[#00031b] px-4 text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select Role</option>
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  {errors.role && (
                    <p className="text-red-500 text-sm mt-1">Role is required</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wide text-gray-300">
                    Status
                  </label>
                  <select
                    {...register("status", { required: true })}
                    className="h-11 w-full rounded-lg border border-white/15 bg-[#00031b] px-4 text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  {errors.status && (
                    <p className="text-red-500 text-sm mt-1">Status is required</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-[#070d33]/80 p-5 md:p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Security</h3>
              <p className="text-sm text-gray-400">
                Optional: fill these fields if you want to change password while
                saving profile.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wide text-gray-300">
                    Old Password
                  </label>
                  <input
                    type="password"
                    {...registerPassword("oldPassword", { required: true })}
                    placeholder="Old password"
                    className="h-11 w-full rounded-lg border border-white/15 bg-[#00031b] px-4 text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {passwordErrors.oldPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      Old password is required
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wide text-gray-300">
                    New Password
                  </label>
                  <input
                    type="password"
                    {...registerPassword("newPassword", {
                      required: true,
                      minLength: 6,
                    })}
                    placeholder="New password"
                    className="h-11 w-full rounded-lg border border-white/15 bg-[#00031b] px-4 text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      New password must be at least 6 characters
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wide text-gray-300">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    {...registerPassword("confirmPassword", {
                      required: true,
                      validate: (value) =>
                        value === watch("newPassword") ||
                        "Confirm password does not match",
                    })}
                    placeholder="Confirm new password"
                    className="h-11 w-full rounded-lg border border-white/15 bg-[#00031b] px-4 text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {passwordErrors.confirmPassword.message ||
                        "Confirm password is required"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 mt-8 flex justify-end gap-3 border-t border-white/10 bg-gradient-to-t from-[#060a2d] to-transparent pt-5">
              <button
                type="button"
                onClick={() => {
                  setUpdateModalOpen(false);
                  reset();
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
                Save Profile Updates
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UpdateUserModal; 