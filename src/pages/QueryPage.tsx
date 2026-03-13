import { useState } from "react";
import PatientForm from "../components/PatientForm";
import FileUpload from "../components/FileUpload";
import ResultPanel from "../components/ResultPanel";

const API_BASE = "http://localhost:8000";

const QueryPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      setResult(json);
    } catch (e: unknown) {
      setResult({
        found: false,
        message: e instanceof Error ? e.message : "Failed to connect to backend. Is the server running?",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)] pr-2">
        <div className="onco-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Patient Information</h2>
          <PatientForm onSubmit={handleSubmit} loading={loading} />
        </div>
        <div className="onco-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Upload</h2>
          <FileUpload />
        </div>
      </div>
      <div className="overflow-y-auto max-h-[calc(100vh-8rem)]">
        <h2 className="text-lg font-semibold text-foreground mb-4">Results</h2>
        <ResultPanel loading={loading} result={result as any} />
      </div>
    </div>
  );
};

export default QueryPage;
