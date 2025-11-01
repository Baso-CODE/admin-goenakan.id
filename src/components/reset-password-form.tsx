"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { GalleryVerticalEnd } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export function ResetPasswordForm({
  token,
  className,
  ...props
}: React.ComponentProps<"div"> & { token: string }) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleResetPassword = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });

    if (error) {
      setIsLoading(false);
      return toast.error(error.message);
    }

    toast.success(
      "Reset Password successfully! Please login with your new password."
    );

    router.push("/login");
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleResetPassword)}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/"
                className="flex flex-col items-center gap-2 font-medium"
              >
                <div className="flex size-8 items-center justify-center rounded-md">
                  <GalleryVerticalEnd className="size-6" />
                </div>
                <span className="sr-only">BetterAuth</span>
              </Link>
              <h1 className="text-xl font-bold">Reset Password</h1>
              <div className="text-center text-sm">
                Remember your password?
                <Link href="/login" className="underline underline-offset-4">
                  Sign in
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="*******" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input placeholder="*******" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Loading" : "Reset Password"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
