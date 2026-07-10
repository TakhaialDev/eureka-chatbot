import axios from "axios";
import Cookies from "js-cookie";
import { store } from "@/redux/store";
import { logOut } from "@/redux/slices/user";
import { toast } from "react-toastify";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const axiosInstance = axios.create({
    baseURL
});

// Function to get user from cookies
const getUser = () => {
    const userCookie = Cookies.get("user") || localStorage.getItem("user");
    return userCookie ? JSON.parse(userCookie) : null;
};
//axios request interceptor to put the token inside every request
axiosInstance.interceptors.request.use(async (req)=>{
    const user = getUser();
    if(user && user.access_token){
        req.headers.Authorization = `Bearer ${user.access_token}`
    }
    // Get the current locale from cookies (NEXT_LOCALE)
    const currentLanguage = Cookies.get("NEXT_LOCALE") || "en";
    req.headers["X-App-Locale"] = currentLanguage;
    return req;
})

//axios response interceptor for dealing with if the token we sent was expired or invalid
axiosInstance.interceptors.response.use(
    res =>res,
    async(error)=>{
        
        const originalRequest = error.config;

        // ✅ Handle CORS errors
        if (!error.response && (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || error.code === 'CORS')) {
            toast.error(`CORS Error: Unable to connect to the server. Please check your network or contact support. Error: ${error.message}`);
            return Promise.reject(error);
        }

        // ✅ Open OTP when recieving status 411
        /* if (error.response?.status === 411) {
            console.log("status 411");
            
            if (typeof window !== "undefined") {
                console.log("window isnt undefined");
                
            }
            return Promise.reject(error);
        } */
        // ✅ Logout User and Go To Login Page when recieving status 401
        /* if (error.response?.status === 401) {
            console.log("status 401");
            Cookies.remove("user");

            if (typeof window !== "undefined") {
                console.log("window isnt undefined");
                window.location.href = "/login"
            }
            return Promise.reject(error);
        } */
        // on status 401
        if(
            error.response.status === 401 && 
            !originalRequest._retry
        ){
            originalRequest._retry = true;
            try{      
                const user = getUser();   
                const token = user?.access_token;
                const response = await axios.post(`${baseURL}/auth/refresh`,{},{
                    headers:{
                        Authorization:`Bearer ${token}`
                    }
                });
                
                const newAccessToken = response.data.access_token;
                const newUser = {
                    user:user.user,
                    access_token:newAccessToken,
                };
                Cookies.set("user",JSON.stringify(newUser),{ 
                    expires:30,
                    path: "/",
                    secure:true,
                    sameSite:"Strict"
                });
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                return axiosInstance(originalRequest);

            }catch(refreshError){
                console.log("deleting user due to refresh failure", refreshError);
                
                Cookies.remove("user");
                store.dispatch(logOut());
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }

)




export default axiosInstance;