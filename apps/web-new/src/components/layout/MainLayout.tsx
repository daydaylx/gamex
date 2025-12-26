import type { JSX } from "preact";
import { Link } from "wouter-preact";
import { Heart, Settings } from "lucide-preact";
import { Button } from "../ui/button";

interface MainLayoutProps {
  children: JSX.Element | JSX.Element[];
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/">
            <a className="flex items-center gap-2 font-bold text-lg hover:text-primary transition-colors">
              <Heart className="h-5 w-5 text-primary fill-primary/20" />
              <span>Gamex</span>
            </a>
          </Link>
          
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto max-w-4xl p-4 md:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container mx-auto flex h-14 max-w-4xl items-center justify-center text-sm text-muted-foreground">
          <p>Local-First & Private. No Cloud.</p>
        </div>
      </footer>
    </div>
  );
}