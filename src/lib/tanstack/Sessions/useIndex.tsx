import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

const fetch = ()=>{
    return axiosInstance.get(`/sessions`);
}


export default function useIndexSessions(){
    return useQuery({
        queryKey:["sessions","index"],
        queryFn:()=>fetch()
    })
}