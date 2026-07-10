import axiosInstance from "@/lib/axios";
import { CreateSessionProps } from "@/utils/types&schemas/Generic/Chat";
import { QueryParams } from "@/utils/types&schemas/Generic/QueryParams";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const store = ()=>{
    return axiosInstance.post(`/sessions`);
}

const useCreateSessions = ({onSuccess,onError}:QueryParams)=>{
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn:store,
        onSuccess: (data)=>{            
            queryClient.invalidateQueries({
                queryKey:["sessions","index"]
            });
            onSuccess && onSuccess(data);
        },
        onError
    })
};

export default useCreateSessions;