"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Cookies from "js-cookie";
import { setUser } from "@/redux/slices/user";
import useGuest from "@/lib/tanstack/Auth/useGuest";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user.user);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAuthVerified, setIsAuthVerified] = useState(false);

  const onSuccess = (data: any) => {
    const userData = data?.data;
    try {
      const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';

      Cookies.set("user", JSON.stringify(userData), {
        expires: 30,
        path: "/",
        secure: isSecure,
        sameSite: "Lax"
      });
      Cookies.set("session_id", userData?.session_id, {
        expires: 30,
        secure: isSecure,
        sameSite: "Lax"
      });
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("session_id", userData?.session_id);
    } catch (error) {
      console.error("Failed to set cookies during background initialization:", error);
    }
    dispatch(setUser(userData));
    setIsInitializing(false);
    setIsAuthVerified(true);
  };

  const onError = (error: any) => {
    console.error("Background Guest Auth Failed:", error);
    toast.error("Connecting to server...");
    // Retry logic
    setTimeout(() => {
        setIsInitializing(false); // Reset to allow retry in useEffect
    }, 5000);
  };

  const guestMutation = useGuest({ onSuccess, onError });

  useEffect(() => {
    const userCookieStr = Cookies.get("user") || localStorage.getItem("user");
    if (userCookieStr || user) {
      if (userCookieStr && !user) {
        try {
          const parsedUser = JSON.parse(userCookieStr);
          dispatch(setUser(parsedUser));
        } catch {
          Cookies.remove("user");
          localStorage.removeItem("user");
        }
      }
      setIsAuthVerified(true);
      return;
    }

    if (!isInitializing) {
      setIsInitializing(true);
      guestMutation.mutate();
    }
  }, [user, isInitializing]);

  return (
    <AnimatePresence mode="wait">
      {isAuthVerified ? (
        <motion.div
           key="app-content"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.5 }}
           className="h-full w-full"
        >
          {children}
        </motion.div>
      ) : (
        <motion.div
          key="auth-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-dark-navy text-white"
        >
          <div className="relative h-16 w-16">
             <div className="absolute inset-0 rounded-full border-4 border-primary-gold/20"></div>
             <motion.div
                className="absolute inset-0 rounded-full border-4 border-t-primary-gold"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
             ></motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
