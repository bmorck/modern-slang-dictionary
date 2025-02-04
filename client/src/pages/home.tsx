import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { TermCard } from "@/components/term-card";
import type { SelectTerm } from "@db/schema";
import { Search, Sparkles, ThumbsUp, ArrowUpIcon, ArrowRightIcon, ArrowDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function Home() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "trending">("score");

  const { data: terms, isLoading } = useQuery<SelectTerm[]>({
    queryKey: ["/api/terms", search, sortBy],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (search) {
        searchParams.set("q", search);
      }
      searchParams.set("sort", sortBy);
      const res = await fetch(`/api/terms?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch terms");
      return res.json();
    },
  });

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="text-center space-y-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              Modern Slang Dictionary
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover and learn today's language
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search slang terms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-background/60 backdrop-blur-sm"
              />
            </div>

            <div className="flex justify-center gap-3">
              <Button
                variant={sortBy === "score" ? "default" : "outline"}
                onClick={() => setSortBy("score")}
                size="sm"
                className="gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                Top Rated
              </Button>
              <Button
                variant={sortBy === "trending" ? "default" : "outline"}
                onClick={() => setSortBy("trending")}
                size="sm"
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Trending
              </Button>
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
        ) : terms?.length === 0 ? (
          <div className="text-center p-8 bg-background/60 backdrop-blur-sm rounded-lg border">
            <p className="text-lg text-muted-foreground">
              {search
                ? "No terms found matching your search."
                : "No terms added yet. Be the first to submit one!"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {terms?.map((term, index) => (
              <TermCard 
                key={term.id} 
                term={term} 
                rank={index + 1}
                showTrend={sortBy === "trending"}
              >
                {sortBy === "trending" && (
                  <TrendIndicator score={term.trendingScore} />
                )}
              </TermCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}