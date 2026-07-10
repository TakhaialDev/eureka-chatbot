import { configureStore } from "@reduxjs/toolkit";
import appSlice from "./slices/app";
import userSlice from "./slices/user";

export const store = configureStore({
  reducer: {
    app: appSlice,
    user: userSlice,
  },
});
