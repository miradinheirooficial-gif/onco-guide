import { useState, useEffect } from "react";
import { Activity, AlertCircle, CheckCircle2 } from "lucide-react";

const API_BASE = "http://localhost:8000";

interface HealthStatus {
  ollama: boolean;
  model: string;
  documents: number;
}

const StatusBar = () => {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
          setError(false);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive text-xs px-3 py-2">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Backend offline</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-xs px-3 py-2">
        <Activity className="w-3.5 h-3.5 animate-pulse" />
        <span>Connecting...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 px-3 py-2 text-xs">
      <div className="flex items-center gap-2 text-primary">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Ollama: {status.model}</span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Activity className="w-3.5 h-3.5" />
        <span>{status.documents} docs indexed</span>
      </div>
    </div>
  );
};

export default StatusBar;
