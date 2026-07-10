import axiosInstance from "@/lib/axios";
import { ReadAloudProps } from "@/utils/types&schemas/Generic/Chat";
import { QueryParams } from "@/utils/types&schemas/Generic/QueryParams";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const store = (data:ReadAloudProps)=>{
    return axiosInstance.post(`/voice/speak`,data);
}

const useReadAloud = ({onSuccess,onError}:QueryParams)=>{
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn:store,
        onSuccess: (data)=>{            
            /* queryClient.invalidateQueries({
                queryKey:["sessions","index"]
            }); */
            onSuccess && onSuccess(data);
        },
        onError
    })
};

export default useReadAloud;