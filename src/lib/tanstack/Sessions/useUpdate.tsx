import axiosInstance from "@/lib/axios";
import { UpdateSessionProps } from "@/utils/types&schemas/Generic/Chat";
import { QueryParams } from "@/utils/types&schemas/Generic/QueryParams";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const store = ({session_id,title}:UpdateSessionProps)=>{
    return axiosInstance.patch(`/sessions/${session_id}/title`,{title});
}

const useUpdateSessions = ({onSuccess,onError}:QueryParams)=>{
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn:store,
        onSuccess: (data)=>{            
            console.log("heyo,",data);
            
            queryClient.invalidateQueries({
                queryKey:["sessions","show",data?.data?.session_id]
            });
            onSuccess && onSuccess(data);
        },
        onError
    })
};

export default useUpdateSessions;