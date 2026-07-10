import { useMutation } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { QueryParams } from "@/utils/types&schemas/Generic/QueryParams";
import { RegisterProps } from "@/utils/types&schemas/Auth/Register";


const register = (data:RegisterProps)=>{
    return axiosInstance.post("/auth/signup",data)
};


const useRegister = ({onSuccess,onError}:QueryParams)=>{
    return useMutation({
        mutationFn:register,
        onSuccess,
        onError
    })
};


export default useRegister;