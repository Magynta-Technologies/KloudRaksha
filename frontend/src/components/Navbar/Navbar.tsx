import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "../ui/use-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
// Add this CSS to create the abstract background pattern
const abstractBgStyle = `
  .abstract-bg {
    position: relative;
    overflow: hidden;
  }
  
  .abstract-bg::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 35%, rgba(35, 81, 229, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 75% 44%, rgba(66, 153, 225, 0.03) 0%, transparent 40%),
      linear-gradient(60deg, rgba(49, 130, 206, 0.01) 12%, transparent 12.5%),
      linear-gradient(120deg, rgba(49, 130, 206, 0.01) 12%, transparent 12.5%),
      linear-gradient(45deg, rgba(66, 153, 225, 0.01) 75%, transparent 75%),
      repeating-linear-gradient(45deg, rgba(66, 153, 225, 0.02) 0%, rgba(66, 153, 225, 0.02) 1%, transparent 1%, transparent 2%);
    background-size: 300% 300%, 200% 200%, 100px 100px, 100px 100px, 60px 60px, 20px 20px;
    background-position: 0% 0%, 0% 0%, 0 0, 0 0, 0 0, 0 0;
    opacity: 0.8;
    z-index: -1;
    animation: gradientShift 15s ease-in-out infinite;
  }

  @keyframes gradientShift {
    0% {
      background-position: 0% 0%, 0% 0%, 0 0, 0 0, 0 0, 0 0;
    }
    50% {
      background-position: 100% 100%, 100% 100%, 0 0, 0 0, 0 0, 0 0;
    }
    100% {
      background-position: 0% 0%, 0% 0%, 0 0, 0 0, 0 0, 0 0;
    }
  }
`;

// Add the style to the document
const styleSheet = document.createElement("style");
styleSheet.innerText = abstractBgStyle;
document.head.appendChild(styleSheet);

function Navbar() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { toast } = useToast();
  const [showUserDetails, setShowUserDetails] = useState(false);

  function handleLogout() {
    auth?.logout();
    toast({
      title: `Logged out ${auth?.user?.name}`,
    });
    navigate("/");
  }

  const avatarStyle = {
    width: "68px",
    height: "48px",
    borderRadius: "100%",
    cursor: "pointer",
    objectFit: "cover",
    transition: "transform 0.2s ease-in-out",
    ":hover": {
      transform: "scale(1.05)",
    },
  };

  function getRandomAvatar() {
    const randomSeed = 1;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
  }

  const userDetailsDropdown = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="absolute right-0 mt-2 w-72 bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl z-50 border border-gray-200/50 abstract-bg"
        style={{
          top: "100%", // Position below the avatar
          transform: "translateX(0)", // Ensure it stays aligned to the right
        }}
      >
        <div className="p-4 relative">
          {" "}
          {/* Reduced padding */}
          {/* Decorative security elements - made smaller */}
          <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 8.96-7 10.12-3.87-1.16-7-5.45-7-10.12V6.3l7-3.12z" />
              <path d="M12 6a4 4 0 100 8 4 4 0 000-8zm0 6a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </div>
          {/* User info section - made more compact */}
          <div className="flex items-center gap-3 mb-4">
            <motion.img
              whileHover={{ scale: 1.05 }}
              src={getRandomAvatar()}
              alt="User Avatar"
              className="w-12 h-12 rounded-full ring-2 ring-blue-500/20"
            />
            <div>
              <h3 className="font-bold text-base bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {auth?.user?.name}
              </h3>
              <p className="text-sm text-gray-600">{auth?.user?.email}</p>
            </div>
          </div>
          {/* Add subtle divider with security icon */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="opacity-50 px-2 text-sm text-gray-500">
                <svg
                  className="w-4 h-4 inline-block"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 12h7c-.53 4.11-3.28 7.78-7 8.92V12H5V6.3l7-3.11M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
              </span>
            </div>
          </div>
          {/* Rest of the existing content */}
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-center gap-2 bg-gray-50/50 p-3 rounded-lg">
              <span className="font-medium">Role:</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                {auth?.user?.role}
              </span>
            </div>
            {auth?.user?.subscription?.planId ? (
              <motion.div
                whileHover={{ x: 5 }}
                className="bg-gray-50/50 p-3 rounded-lg"
              >
                <Link
                  to="/user"
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 group"
                >
                  View Invoice
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </motion.div>
            ) : (
              <div className="bg-gray-50/50 p-3 rounded-lg">
                <p className="text-gray-500">No payment details</p>
              </div>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleLogout}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/20"
              >
                Sign Out
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
  const list = [
    {
      name: "About",
      link: "/about",
    },
    {
      name: "Help",
      link: "/help",
    },
    {
      name: "Contact",
      link: "/contact",
    },
    {
      name: "Plans",
      link: "/payment",
    },
    {
      name: auth?.user ? "Dashboard" : "Login",
      link: auth?.user ? "/Dashboard" : "/auth",
    },
  ];

  if (auth?.user) {
    list.splice(
      list.findIndex((item) => item.name === "Contact"),
      1
    );
    list.splice(
      list.findIndex((item) => item.name === "Support"),
      1
    );
    list.splice(
      list.findIndex((item) => item.name === "Help"),
      1
    );
    list.splice(
      list.findIndex((item) => item.name === "About"),
      1
    );
    list.splice(
      list.findIndex((item) => item.name === "Plans"),
      1
    );
  }
  if (auth?.user?.role === "admin") {
    list.push({
      name: "Admin Page",
      link: "/admin",
    });
  } else if (auth?.user?.role === "superadmin") {
    list.push({
      name: "Super Admin Page",
      link: "/superadmin",
    });
  } else if (auth?.user?.role === "user") {
    list.push({
      name: "Dashboard",
      link: "/user",
    });
  }

  return (
    <div className="relative">
      <nav className="mx-auto py-4 flex justify-between max-w-[95vw] items-center">
        <div>
          <Link to="/">
            <img
              src="/Final.png"
              alt="Website Logo"
              className="scroll-m-20 text-xl font-semibold tracking-tight"
              style={{ width: "20%", height: "20%" }}
            />
          </Link>
        </div>
        <div className="flex gap-2 items-center">
          {list.map((item) => {
            if (item.name === "Login") {
              return (
                <Button className="font-bold" key={item.name} asChild>
                  <Link to={item.link}>{item.name}</Link>
                </Button>
              );
            } else if (item.name === "Get Started") {
              return (
                <Button className="font-bold" key={item.name} asChild>
                  <Link to={item.link}>{item.name}</Link>
                </Button>
              );
            } else if (item.name === "Logout") {
              return (
                <Button
                  onClick={handleLogout}
                  className="font-bold"
                  key={item.name}
                  asChild
                >
                  <Link to={item.link}>{item.name}</Link>
                </Button>
              );
            }
            return (
              <Button
                className="font-bold"
                variant="ghost"
                key={item.name}
                asChild
              >
                <Link to={item.link}>{item.name}</Link>
              </Button>
            );
          })}
          <ThemeToggle />
        </div>
        {auth?.user && (
          <div className="relative">
            <motion.img
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              src={getRandomAvatar()}
              alt="User Avatar"
              //@ts-ignore
              style={avatarStyle}
              onClick={() => setShowUserDetails(!showUserDetails)}
              className="ring-2 ring-blue-500/20 hover:ring-blue-500/40 transition-all duration-200"
            />
          </div>
        )}
      </nav>

      {auth?.user && showUserDetails && (
        <div className="absolute right-0 z-50" style={{ top: "80px" }}>
          {userDetailsDropdown}
        </div>
      )}
    </div>
  );
}

export default Navbar;
