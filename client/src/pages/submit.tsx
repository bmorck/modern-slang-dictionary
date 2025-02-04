import { SubmitForm } from "@/components/submit-form";

export default function Submit() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container py-12 max-w-xl mx-auto px-4">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-br from-primary to-primary-foreground bg-clip-text text-transparent">
            Submit New Term
          </h1>
          <p className="text-lg text-muted-foreground">
            Help grow the dictionary by adding new slang terms and their meanings.
          </p>
        </div>
        <div className="bg-background/60 backdrop-blur-sm p-6 rounded-lg border-2 hover:border-primary/20 transition-colors">
          <SubmitForm />
        </div>
      </div>
    </div>
  );
}