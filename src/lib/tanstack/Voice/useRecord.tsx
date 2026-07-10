import axiosInstance from "@/lib/axios";
import { ChatMessage, RecordProps } from "@/utils/types&schemas/Generic/Chat";
import { QueryParams } from "@/utils/types&schemas/Generic/QueryParams";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const store = (data:RecordProps)=>{
    const formData = new FormData();
    formData.append("file",data.file);

    formData.append("session_id",data?.session_id);
    return axiosInstance.post(`/voice/query`,formData);
}

const useRecord = ({onSuccess,onError}:QueryParams)=>{
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn:store,
        onMutate: async (data: RecordProps) => {       
            // 🔒 Cancel outgoing history requests to avoid overwrite
            await queryClient.cancelQueries({ queryKey: ["chat", "show", data.session_id] });

            // 🗂 Get previous history
            const previousHistory = queryClient.getQueryData<{data:ChatMessage[]}>(["chat", "show", data.session_id]);
            console.log(previousHistory);
            
            // ✨ Optimistically update history
            queryClient.setQueryData<{data:ChatMessage[]}>(
                ["chat", "show", data.session_id],
                (old)=>{
                const currentMessages = old?.data && Array.isArray(old.data) ? old.data : [];
                return {
                    ...old,  // Keep other properties from the response object
                    data: [
                        {
                            id: crypto.randomUUID(),
                            role: "user",
                            content: "",
                            audio_url: data.file instanceof Blob ? URL.createObjectURL( data.file) : data.file,
                        },
                        ...currentMessages
                    ]
                };
            });

            // Return previous state for rollback
            return { previousHistory };
        },
        onSuccess: (data)=>{            
            /* queryClient.invalidateQueries({
                queryKey:["sessions","index"]
            }); */
            onSuccess && onSuccess(data);
        },
        onError
    })
};

export default useRecord;