import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

const fetch = (id:any)=>{
    return axiosInstance.get(`/sessions/${id}`)
}

const useShowSessions = (id:any)=>{
    return useQuery({
        queryFn:()=>fetch(id),
        queryKey:["sessions","show",id],
        enabled:!!id
    })
};

export default useShowSessions;