import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowBigUp, ArrowBigDown } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SelectTerm } from "@db/schema";
import { motion } from "framer-motion";
import { VoteButtons } from "./vote-buttons";
import { TrendIndicator } from "./trend-indicator";

interface TermCardProps {
  term: SelectTerm;
  rank: number;
  showTrend?: boolean;
}

export function TermCard({ term, rank, showTrend }: TermCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const voteMutation = useMutation({
    mutationFn: async (value: number) => {
      const res = await apiRequest("POST", `/api/terms/${term.id}/vote`, { value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/terms"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error voting",
        description: error.message === "400: You have already voted on this term"
          ? "You have already voted on this term"
          : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden bg-background/60 backdrop-blur-sm border-2 hover:border-primary/20 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-primary/10 rounded-lg">
              <span className="text-xl font-bold text-primary">#{rank}</span>
            </div>
            <div className="flex-grow">
              <div className="flex items-start justify-between">
                <h2 className="text-2xl font-bold text-foreground">
                  {term.term}
                </h2>
                {showTrend && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground ml-4">
                    <TrendIndicator score={term.trendingScore} />
                  </div>
                )}
              </div>
              <p className="text-foreground/90 leading-relaxed mt-4 mb-4">{term.definition}</p>
              <div className="pl-4 border-l-2 border-primary/20">
                <p className="italic text-muted-foreground">&quot;{term.example}&quot;</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center bg-muted/20 px-6 py-4">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => voteMutation.mutate(1)}
              disabled={voteMutation.isPending}
              className="hover:text-primary transition-colors"
            >
              <ArrowBigUp className="h-5 w-5" />
            </Button>
            <span className="font-mono font-medium min-w-[3ch] text-center">
              {term.score}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => voteMutation.mutate(-1)}
              disabled={voteMutation.isPending}
              className="hover:text-primary transition-colors"
            >
              <ArrowBigDown className="h-5 w-5" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}