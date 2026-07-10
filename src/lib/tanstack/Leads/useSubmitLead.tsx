import axiosInstance from "@/lib/axios";
import { QueryParams } from "@/utils/types&schemas/Generic/QueryParams";
import { markLeadSubmitted } from "@/utils/types&schemas/leadStorage";
import { useMutation } from "@tanstack/react-query";

export type SubmitLeadProps = {
  session_id: string;
  name?: string;
  phone?: string;
  /** Only true for the full floating contact form — not inline name/phone widgets */
  markAsComplete?: boolean;
};

const submitLead = async ({ markAsComplete: _markAsComplete, ...payload }: SubmitLeadProps) => {
  const response = await axiosInstance.post("/leads", payload);
  return response.data;
};

const useSubmitLead = ({ onSuccess, onError }: QueryParams = {}) => {
  return useMutation({
    mutationFn: submitLead,
    onSuccess: (data, variables) => {
      if (variables.markAsComplete) {
        markLeadSubmitted(variables.session_id);
      }
      onSuccess?.(data);
    },
    onError,
  });
};

export default useSubmitLead;
