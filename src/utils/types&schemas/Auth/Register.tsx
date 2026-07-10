import * as z from "zod";

export const registerSchema = z.object({
    // optional and nullable: can be string, null or undefined
    email: z.string()
    .min(1, "Email is required") // required check FIRST
    .pipe(
      z.email({message:"Invalid Email"})
    ),
    password: z.string().min(4, "Password Required"),
});

export type RegisterProps = z.infer<typeof registerSchema>;