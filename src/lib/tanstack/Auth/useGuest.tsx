import { useMutation } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { QueryParams } from "@/utils/types&schemas/Generic/QueryParams";


const login = ()=>{
    return axiosInstance.post("/auth/guest")
};


const useGuest = ({onSuccess,onError}:QueryParams)=>{
    return useMutation({
        mutationFn:login,
        onSuccess,
        onError
    })
};


export default useGuest;