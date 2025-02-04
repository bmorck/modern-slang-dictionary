import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { SelectTerm } from "@db/schema";
import { useState } from "react";
import { Shield, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function getFlagDetails(note: string | null) {
  if (!note) return null;

  const type = note.match(/^\[(.*?)\]/)?.[1] || "OTHER";
  const message = note.replace(/^\[(.*?)\]\s*/, "");

  const typeConfig = {
    AI: {
      icon: AlertCircle,
      title: "AI Moderation Flag",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
      textColor: "text-yellow-700",
    },
    SPAM: {
      icon: AlertCircle,
      title: "Potential Spam",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
      textColor: "text-orange-700",
    },
    LENGTH: {
      icon: AlertCircle,
      title: "Length Limit Exceeded",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      textColor: "text-blue-700",
    },
    ERROR: {
      icon: AlertCircle,
      title: "System Error",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      textColor: "text-red-700",
    },
    PROFANITY: {
      icon: AlertCircle,
      title: "Profanity Detected",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      textColor: "text-purple-700",
    },
    OTHER: {
      icon: AlertCircle,
      title: "Moderation Flag",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/20",
      textColor: "text-destructive",
    },
  };

  return {
    ...typeConfig[type as keyof typeof typeConfig],
    message,
  };
}

export default function ModDashboard() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTerm, setSelectedTerm] = useState<SelectTerm | null>(null);
  const [note, setNote] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const { data: terms = [], isLoading } = useQuery<SelectTerm[]>({
    queryKey: ["/api/mod/terms"],
    retry: false,
    onError: () => {
      toast({
        title: "Unauthorized",
        description: "Please login as a moderator.",
        variant: "destructive",
      });
      setLocation("/mod/login");
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      note,
    }: {
      id: number;
      action: "approve" | "reject";
      note: string;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/mod/terms/${id}/${action}`,
        { note }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mod/terms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/terms"] });
      setSelectedTerm(null);
      setNote("");
      setAction(null);
      toast({
        title: "Success",
        description: "Term has been moderated.",
      });
    },
  });

  const handleModerate = (action: "approve" | "reject") => {
    if (!selectedTerm) return;
    moderateMutation.mutate({ id: selectedTerm.id, action, note });
  };

  const flaggedTerms = terms.filter((term) => term.moderationNote);
  const unflaggedTerms = terms.filter((term) => !term.moderationNote);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container py-12 max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">
            Moderation Dashboard
          </h1>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-full h-48 rounded-lg animate-pulse bg-muted/50"
              />
            ))}
          </div>
        ) : terms.length === 0 ? (
          <Card className="bg-background/60 backdrop-blur-sm">
            <CardContent className="pt-6">
              <p className="text-lg text-center text-muted-foreground">
                No terms waiting for moderation.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="unflagged" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unflagged" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Clean Terms ({unflaggedTerms.length})
              </TabsTrigger>
              <TabsTrigger value="flagged" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                Flagged Terms ({flaggedTerms.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unflagged">
              <div className="space-y-6">
                {unflaggedTerms.map((term) => (
                  <Card
                    key={term.id}
                    className="overflow-hidden bg-background/60 backdrop-blur-sm border-2 hover:border-primary/20 transition-colors"
                  >
                    <CardContent className="p-6">
                      <h2 className="text-2xl font-bold text-foreground mb-3">
                        {term.term}
                      </h2>
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        {term.definition}
                      </p>
                      <div className="pl-4 border-l-2 border-primary/20">
                        <p className="italic text-muted-foreground">
                          &quot;{term.example}&quot;
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3 bg-muted/20 px-6 py-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedTerm(term);
                          setAction("reject");
                        }}
                        className="gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedTerm(term);
                          setAction("approve");
                        }}
                        className="gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="flagged">
              <div className="space-y-6">
                {flaggedTerms.map((term) => (
                  <Card
                    key={term.id}
                    className="overflow-hidden bg-background/60 backdrop-blur-sm border-2 hover:border-primary/20 transition-colors"
                  >
                    <CardContent className="p-6">
                      <h2 className="text-2xl font-bold text-foreground mb-3">
                        {term.term}
                      </h2>
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        {term.definition}
                      </p>
                      <div className="pl-4 border-l-2 border-primary/20">
                        <p className="italic text-muted-foreground">
                          &quot;{term.example}&quot;
                        </p>
                      </div>

                      {term.moderationNote && (
                        <div className="mt-4">
                          {(() => {
                            const flag = getFlagDetails(term.moderationNote);
                            const Icon = flag?.icon;
                            return (
                              <div className={`p-4 border rounded-lg ${flag?.bgColor} ${flag?.borderColor}`}>
                                <div className={`flex items-center gap-2 ${flag?.textColor} mb-2`}>
                                  {Icon && <Icon className="h-5 w-5" />}
                                  <h3 className="font-semibold">{flag?.title}</h3>
                                </div>
                                <p className={`text-sm ${flag?.textColor}/90`}>
                                  {flag?.message}
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3 bg-muted/20 px-6 py-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedTerm(term);
                          setAction("reject");
                        }}
                        className="gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedTerm(term);
                          setAction("approve");
                        }}
                        className="gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <Dialog
          open={selectedTerm !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTerm(null);
              setNote("");
              setAction(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {action === "approve" ? "Approve" : "Reject"} Term
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder={action === "approve" ? "Add a note (optional)" : "Add a reason for rejection"}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required={action === "reject"}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTerm(null);
                  setNote("");
                  setAction(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => action && handleModerate(action)}
                disabled={moderateMutation.isPending || (action === "reject" && !note)}
              >
                {moderateMutation.isPending
                  ? "Processing..."
                  : action === "approve"
                  ? "Approve"
                  : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}