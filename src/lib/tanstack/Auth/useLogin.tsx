import { useMutation } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { QueryParams } from "@/utils/types&schemas/Generic/QueryParams";
import { toast } from "react-toastify";


const login = (data:any)=>{
    return axiosInstance.post("/auth/login",data)
};


const useLogin = ({onSuccess,onError}:QueryParams)=>{
    return useMutation({
        mutationFn:login,
        onSuccess,
        onError,
        onMutate:async()=>{
            // optional: perform actions before mutation
            toast.info("Logging in...");
        }
    })
};


export default useLogin;