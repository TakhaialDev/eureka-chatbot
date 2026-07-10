import { createSlice } from "@reduxjs/toolkit";


interface AppState {
    isExpanded:boolean,
}

const initialState: AppState = {
    isExpanded:false,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    switchSidebar:(state,action)=>{
        state.isExpanded = !state.isExpanded;
    },
    closeSidebar:(state,action)=>{
        state.isExpanded = false;
    }

  },
});

export const { switchSidebar , closeSidebar } = appSlice.actions;
export default appSlice.reducer;