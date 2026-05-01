import React from "react";
import Link from "next/link";
import { X } from "lucide-react"; // Optional: use any icon library you prefer
import { usePathname } from "next/navigation";
import {
  MdCategory,
  MdDiscount,
  MdMovie,
  MdRateReview,
  MdSpaceDashboard,
  MdSubscriptions,
  MdPerson,
  MdReceipt,
} from "react-icons/md";
import { FaUsers } from "react-icons/fa";
import { useAppSelector } from "@/components/redux/hooks";
import { selectCurrentToken } from "@/components/redux/features/auth/authSlice";
import { verifyToken } from "@/utils/verifyToken";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const menuItems = [
  { name: "Overview", icon: <MdSpaceDashboard />, link: "/dashboard" },
  { name: "Content", icon: <MdMovie />, link: "/dashboard/content" },
  { name: "Users", icon: <FaUsers />, link: "/dashboard/users" },
  { name: "Reviews", icon: <MdRateReview />, link: "/dashboard/reviews" },
  {
    name: "Platform & Genre",
    icon: <MdCategory />,
    link: "/dashboard/platformGenre",
  },
  { name: "Discount", icon: <MdDiscount />, link: "/dashboard/discount" },
  {
    name: "Subscribers",
    icon: <MdSubscriptions />,
    link: "/dashboard/subscribers",
  },
];

const userRoutes = [
  {
    name: "Profile",
    link: "/dashboard/profile",
    icon: <MdPerson />,
  },
  {
    name: "Purchase History",
    link: "/dashboard/purchasehistory",
    icon: <MdReceipt />,
  },
  {
    name: "Watchlist",
    link: "/dashboard/watchlist",
    icon: <MdMovie />,
  },
  {
    name: "My Reviews",
    link: "/dashboard/reviews",
    icon: <MdRateReview />,
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const pathname = usePathname();
  const token = useAppSelector(selectCurrentToken);
  let user;
  if (token) {
    user = verifyToken(token);
  }

  const routes =
    user?.role === "ADMIN"
      ? menuItems
      : user?.role === "USER"
      ? userRoutes
      : [];

  return (
    <aside
      className={`fixed z-40 top-0 left-0 h-full w-64 bg-[#010527]   border-r border-[#010e65] transform transition-transform duration-300 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 lg:static lg:block`}
    >
      <div className="relative p-6 h-full flex flex-col">
        {/* Close Button (visible only on mobile) */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white lg:hidden"
          onClick={toggleSidebar}
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold  ">
            {user?.role === "ADMIN" ? "Admin Dashboard" : "User Dashboard"}
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 border-t pt-2 border-[#00175f]/50">
          {routes?.map((item) => (
            <Link
              key={item?.name}
              href={`${item.link}`}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                pathname === item.link ? "bg-[#00175f]/60" : ""
              } hover:bg-[#00175f]/60 transition-colors text-gray-300 hover:text-white`}
            >
              <span className="material-icons-outlined ">{item?.icon}</span>
              {item?.name}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-[#00175f]/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-purple-400">⚙️</span>
            </div>
            <span className="text-sm text-gray-400">Settings</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
