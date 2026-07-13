"use client";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { useState } from "react";
import { QueryClient , QueryClientProvider } from "@tanstack/react-query";
import "react-toastify/dist/ReactToastify.css";
import { motion , AnimatePresence } from "framer-motion";
import { ToastContainer } from "react-toastify";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import AuthInitializer from "../AuthInitializer";

const variants = {
  hidden: { opacity: 0, x: -200 },
  enter: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 200 },
};

export default function ClientProvider({ children }:{ children: React.ReactNode}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5, // 5 minutes
          },
        },
      })
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AnimatePresence>
        <Provider store={store}>
          <AuthInitializer>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              closeOnClick
              pauseOnHover
            />
              <motion.div
              variants={variants}
              initial="hidden"
              animate="enter"
              exit="exit"
              transition={{ type: "tween", duration: 0.5 }}
              >
                {children}
              </motion.div>
              <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left"/>
          </AuthInitializer>
        </Provider>
      </AnimatePresence>
    </QueryClientProvider>
    );
}