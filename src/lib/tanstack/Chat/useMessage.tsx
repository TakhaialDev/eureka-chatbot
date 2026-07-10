import axiosInstance from "@/lib/axios";
import { ChatMessage, SendMessageProps } from "@/utils/types&schemas/Generic/Chat";
import { QueryParams } from "@/utils/types&schemas/Generic/QueryParams";
import { useMutation, useQueryClient } from "@tanstack/react-query";




const store = async(data:SendMessageProps)=>{
    const response = await axiosInstance.post(`/chat`,data);
    return response.data;
}


const useChatMessage = ({onSuccess,onError}:QueryParams)=>{
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn:store,
        onMutate: async (data: SendMessageProps) => {
            
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
                            content: data.message
                        },
                        ...currentMessages
                    ]
                };
            });

            // Return previous state for rollback
            return { previousHistory };
        },
        onSuccess,
        onError: (_error, newMessage, context) => {
            // ❌ Roll back if the mutation fails
            if (context?.previousHistory) {
            queryClient.setQueryData(
                ["chat","show", newMessage.session_id],
                context.previousHistory
            );
            }
            onError && onError(_error)
        },
    })
};

export default useChatMessage;