import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { termSchema, type TermFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export function SubmitForm() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<TermFormData>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      term: "",
      definition: "",
      example: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: TermFormData) => {
      const res = await apiRequest("POST", "/api/terms", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Term submitted successfully!",
        description: "Your term has been added to the dictionary.",
      });
      setLocation("/");
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => submitMutation.mutate(data))}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="term"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Term</FormLabel>
              <FormControl>
                <Input placeholder="Enter the slang term" {...field} />
              </FormControl>
              <FormDescription>
                The new slang word or phrase you want to define
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="definition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Definition</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Explain what the term means"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide a clear and concise explanation of the term
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="example"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Example Usage</FormLabel>
              <FormControl>
                <Input placeholder="Show how the term is used in a sentence" {...field} />
              </FormControl>
              <FormDescription>
                Add a real-world example of how the term is used
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? "Submitting..." : "Submit Term"}
        </Button>
      </form>
    </Form>
  );
}