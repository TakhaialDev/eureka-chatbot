import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

const fetch = (id:any)=>{
    return axiosInstance.get(`/voice/task/${id}`)
}

const useStatusTaskVoice = (id:any)=>{
    return useQuery({
        queryFn:()=>fetch(id),
        queryKey:["voice","status",id],
        enabled:Boolean(id),
        refetchInterval:(data:any)=>{
            /* console.log("refetch status",data?.state?.data?.data?.status); */
            const status = data?.state?.data?.data?.status;
            if(!status) return 1500;
            return status === "completed"? false : 1500;
        }
    })
};

export default useStatusTaskVoice;