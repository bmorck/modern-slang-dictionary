import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { loginSchema, type LoginFormData } from "@db/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ModLogin() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await apiRequest("POST", "/api/mod/login", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Login successful",
        description: "Welcome back, moderator!",
      });
      setLocation("/mod/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: "Invalid username or password.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container py-12 max-w-md mx-auto px-4">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-br from-primary to-primary-foreground bg-clip-text text-transparent">
            Moderator Login
          </h1>
          <p className="text-lg text-muted-foreground">
            Sign in to review and moderate terms
          </p>
        </div>
        <div className="bg-background/60 backdrop-blur-sm p-6 rounded-lg border-2 hover:border-primary/20 transition-colors">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Enter username" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
