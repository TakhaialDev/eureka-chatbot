import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

const fetch = (id: any) => {
    return axiosInstance.get(`/history?session_id=${id}`)
}

const useShowChat = (id: any) => {
    return useQuery({
        queryFn: () => fetch(id),
        queryKey: ["chat", "show", id],
        enabled: !!id
    })
};

export default useShowChat;