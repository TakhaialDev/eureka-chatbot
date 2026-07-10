import axiosInstance from "@/lib/axios";
import { QueryParams } from "@/utils/types&schemas/Generic/QueryParams";
import { useMutation, useQueryClient } from "@tanstack/react-query";




const store = (id:string)=>{
    return axiosInstance.delete(`/sessions/${id}`);
}

export default function useDeleteSession({onSuccess,onError}:QueryParams){
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
