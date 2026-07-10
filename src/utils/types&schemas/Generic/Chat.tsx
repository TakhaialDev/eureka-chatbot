import { z } from "zod";

export const SendMessageSchema = z.object({
  session_id: z.string().min(1, "session Id is Required"),
  message: z.string().min(1, "Message Is Required")
})

export type SendMessageProps = z.infer<typeof SendMessageSchema>;

export type ImageProp ={
  url:string;
  description:string;
  filename:string;
  score:number;
};

export type ChatWidgetType = "collect_name" | "collect_phone";

export type ChatWidget = {
  type: ChatWidgetType;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  audio_url?: string;
  images?: ImageProp[];
  reply_to?: { content: string };
  widget?: ChatWidget;
};

export type RecordProps = {
  file: string | Blob;
  session_id: string;
}
export type ReadAloudProps = {
  text: string;
  message_id: string;
  session_id: string;
}


export const CreateSessionSchema = z.object({
  title: z.string().min(1, "Title Is Required")
});

export type CreateSessionProps = z.infer<typeof CreateSessionSchema>;

export const UpdateSessionSchema = z.object({
  title: z.string().min(1, "Title Is Required"),
  session_id: z.string().min(1, "Session ID is Required")
});

export type UpdateSessionProps = z.infer<typeof UpdateSessionSchema>;
