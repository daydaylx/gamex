import { useState } from "preact/hooks";
import { Plus, ChevronRight, Calendar } from "lucide-preact";
import { Link } from "wouter-preact";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

// Dummy Data for UI Dev
const MOCK_SESSIONS = [
  { id: "1", name: "Dezember Check-in", date: "2025-12-24", progressA: 100, progressB: 45, status: "active" },
  { id: "2", name: "Silvester Planung", date: "2025-12-26", progressA: 0, progressB: 0, status: "new" },
];

export function HomeView() {
  const [sessions] = useState(MOCK_SESSIONS);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="space-y-4 py-4 md:py-10 text-center md:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          Intimacy. <span className="text-primary">Structured.</span>
        </h1>
        <p className="max-w-[700px] text-muted-foreground md:text-xl">
          Ein sicherer Raum für ehrliche Gespräche. Vergleiche Grenzen und Wünsche, ohne Druck. Deine Daten verlassen nie dein Gerät.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" /> Neue Session
          </Button>
          <Button size="lg" variant="outline">
            Mehr erfahren
          </Button>
        </div>
      </section>

      {/* Session List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Deine Sessions</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {sessions.map((session) => (
            <Link key={session.id} href={`/sessions/${session.id}`}>
              <a className="block group">
                <Card className="transition-all hover:border-primary/50 hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {session.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(session.date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={session.progressA === 100 ? "success" : "secondary"}>
                        Person A: {session.progressA}%
                      </Badge>
                      <Badge variant={session.progressB === 100 ? "success" : "secondary"}>
                        Person B: {session.progressB}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}
          
          {/* New Session Card Placeholder */}
          <button className="flex h-full min-h-[140px] w-full flex-col items-center justify-center rounded-lg border border-dashed hover:bg-accent/50 transition-colors gap-2 text-muted-foreground hover:text-foreground">
            <Plus className="h-8 w-8 opacity-50" />
            <span className="font-medium">Neue Session erstellen</span>
          </button>
        </div>
      </section>
    </div>
  );
}