import {z} from "zod";

export const loginSchema = z.object({
    email: z.string()
    .min(1, "Email is required") // required check FIRST
    .pipe(
      z.email({message:"Invalid Email"})
    ),
    password: z.string().min(8, "Password Is 8 Characters Minimum"),
})

export type LoginProps = z.infer<typeof loginSchema>;