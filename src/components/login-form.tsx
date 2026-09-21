"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
});

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isSubmitting } = form.formState;

  const handleSignIn = async (values: z.infer<typeof formSchema>) => {
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
        callbackUrl: "/",
      });

      if (res?.error) {
        toast.error("Invalid credentials or user not found");
        return;
      }

      toast.success("Login successful!");
      router.push(res?.url || "/");
    } catch (error) {
      toast.error("Something went wrong during login");
    }
    // Kita hapus finally { setIsLoading(false) } karena sudah diotomatisasi oleh isSubmitting
  };

  const handleSignInGoogle = async () => {
    try {
      setIsLoading(true);
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      toast.error("Failed to login with Google");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSignIn)}
        className={cn("flex flex-col gap-6", className)}
        {...props}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>

        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="me@example.com"
                    {...field}
                    disabled={isSubmitting || isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline">
                    Forgot your password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    placeholder="Password"
                    type="password"
                    {...field}
                    disabled={isSubmitting || isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Loading..." : "Login"}
          </Button>

          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">
              Or continue with
            </span>
          </div>

          <Button
            variant="outline"
            type="button"
            className="w-full"
            onClick={handleSignInGoogle}
            disabled={isSubmitting || isLoading}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-5 w-5 mr-2">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            Continue with Google
          </Button>
        </div>
      </form>
    </Form>
  );
}
