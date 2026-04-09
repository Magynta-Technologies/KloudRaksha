import axios from "axios";

const getBaseURL = () => {
  // Use VITE_API_URL if set during build
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL.replace(/\/$/, "");
    // If it's a relative URL, return as-is
    if (url.startsWith("/")) {
      return url;
    }
    // If it's an absolute URL with a hostname, use it
    return url;
  }
  
  // Fallback: use relative path that nginx will proxy
  return "/api";
};

const baseURL = getBaseURL();

export default axios.create({
  baseURL,
  withCredentials: true,
});
