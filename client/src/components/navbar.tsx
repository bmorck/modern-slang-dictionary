import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Shield, TrendingUp } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();
  const isModSection = location.startsWith("/mod");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container h-14 max-w-screen-2xl">
        <div className="flex h-full items-center justify-between">
          <Link href="/">
            <Button
              variant="ghost"
              className="text-xl font-semibold"
            >
              Modern Slang
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            {!isModSection && (
              <>
                <Link href="/insights">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Insights
                  </Button>
                </Link>
                <Link href="/submit">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Term
                  </Button>
                </Link>
              </>
            )}
            <Link href={isModSection ? "/" : "/mod/login"}>
              <Button variant="ghost" size="sm" className="gap-2">
                <Shield className="h-4 w-4" />
                {isModSection ? "Exit Mod Panel" : "Moderator Login"}
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}