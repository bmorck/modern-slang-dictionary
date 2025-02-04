import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TermCard } from "@/components/term-card";
import { TrendIndicator } from "@/components/trend-indicator";
import type { Term } from "@/lib/types";

export default function Home() {
  // State
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "trending">("score");
  const [page, setPage] = useState(1);

  // Data fetching
  const { data, isLoading } = useQuery<Term[]>({
    queryKey: ["/api/terms", search, sortBy, page],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        ...(search && { q: search }),
        sort: sortBy,
        limit: "25",
        offset: ((page - 1) * 25).toString(),
      });

      const res = await fetch(`/api/terms?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch terms");
      return res.json();
    },
  });

  // Event handlers
  const handleSortChange = (newSort: "score" | "trending") => {
    setSortBy(newSort);
    setPage(1);
  };

  return (
    <div className="flex justify-center min-h-screen bg-background">
      <div className="w-full max-w-4xl py-10 px-4 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-center">Modern Slang Dictionary</h1>
          <p className="text-xl text-center text-muted-foreground">
            Find and share modern slang terms and their meanings
          </p>
        </div>

        {/* Search */}
        <div className="flex justify-center">
          <Input
            type="search"
            placeholder="Search terms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm w-full"
          />
        </div>

        {/* Sort Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            variant={sortBy === "score" ? "default" : "outline"}
            onClick={() => handleSortChange("score")}
          >
            Top Rated
          </Button>
          <Button
            variant={sortBy === "trending" ? "default" : "outline"}
            onClick={() => handleSortChange("trending")}
          >
            Trending
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-full h-48 rounded-lg animate-pulse bg-muted/50"
              />
            ))}
          </div>
        ) : !data?.length ? (
          <div className="text-center p-8 bg-background/60 backdrop-blur-sm rounded-lg border">
            <p className="text-lg text-muted-foreground">
              {search
                ? "No terms found matching your search."
                : "No terms added yet. Be the first to submit one!"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {data.map((term) => (
              <TermCard 
                key={term.id} 
                term={term} 
                rank={term.rank}
                showTrend={sortBy === "trending"}
              >
                {sortBy === "trending" && (
                  <TrendIndicator score={term.trendingScore} />
                )}
              </TermCard>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data?.length > 0 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <span>Page {page}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={data.length < 25}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}