import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import type { SelectTerm } from "@db/schema";
import { Search, TrendingUp, ArrowUpIcon, ArrowRightIcon, ArrowDownIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

function TrendIndicator({ score }: { score: number }) {
  if (score >= 1) {
    return (
      <div className="flex items-center gap-1 text-green-500">
        <ArrowUpIcon className="h-4 w-4" />
        <span className="text-sm font-medium">Rising</span>
      </div>
    );
  }
  if (score <= -1) {
    return (
      <div className="flex items-center gap-1 text-red-500">
        <ArrowDownIcon className="h-4 w-4" />
        <span className="text-sm font-medium">Falling</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-yellow-500">
      <ArrowRightIcon className="h-4 w-4" />
      <span className="text-sm font-medium">Stable</span>
    </div>
  );
}

export default function Insights() {
  const [search, setSearch] = useState("");

  const { data: terms, isLoading } = useQuery<SelectTerm[]>({
    queryKey: ["/api/terms/insights", search],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (search) {
        searchParams.set("q", search);
      }
      const res = await fetch(`/api/terms/insights?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch term insights");
      return res.json();
    },
  });

  const sortedTerms = useMemo(() => {
    if (!terms) return [];
    console.log('Terms with trending scores:', terms);
    return [...terms].sort((a, b) => Math.abs(b.trendingScore) - Math.abs(a.trendingScore));
  }, [terms]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="text-center space-y-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
              <TrendingUp className="h-8 w-8" />
              Term Insights
            </h1>
            <p className="text-lg text-muted-foreground">
              Track how slang terms trend over time
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search terms to analyze..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-background/60 backdrop-blur-sm"
              />
            </div>
          </div>
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
        ) : sortedTerms.length === 0 ? (
          <div className="text-center p-8 bg-background/60 backdrop-blur-sm rounded-lg border">
            <p className="text-lg text-muted-foreground">
              {search
                ? "No terms found matching your search."
                : "No trending data available yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedTerms.map((term) => {
              console.log(`Term ${term.term} trending score:`, term.trendingScore);
              return (
                <Card key={term.id} className={cn(
                  "bg-background/60 backdrop-blur-sm",
                  term.trendingScore >= 1 && "border-green-500/20 bg-green-500/5",
                  term.trendingScore <= -1 && "border-red-500/20 bg-red-500/5",
                  Math.abs(term.trendingScore) < 1 && "border-yellow-500/20 bg-yellow-500/5"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-foreground">
                        {term.term}
                      </h2>
                      <div className="flex items-center gap-2">
                        <TrendIndicator score={term.trendingScore} />
                        <span className="text-sm text-muted-foreground">
                          ({term.trendingScore.toFixed(1)})
                        </span>
                      </div>
                    </div>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { date: '1 Day', score: term.score - term.trendingScore },
                            { date: 'Current', score: term.score },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
