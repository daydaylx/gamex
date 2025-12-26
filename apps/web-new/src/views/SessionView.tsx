import { Link, useRoute } from "wouter-preact";
import { ArrowLeft } from "lucide-preact";
import { Button } from "../components/ui/button";

export function SessionView() {
  const [match, params] = useRoute("/sessions/:id");
  const id = match ? params.id : "unknown";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Session {id}</h1>
          <p className="text-muted-foreground">Dashboard</p>
        </div>
      </div>
      
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p>Hier kommt das Session-Dashboard hin.</p>
        <p className="text-sm text-muted-foreground mt-2">Work in Progress</p>
      </div>
    </div>
  );
}