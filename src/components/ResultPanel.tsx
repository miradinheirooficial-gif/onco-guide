import { Loader2, AlertTriangle } from "lucide-react";

interface Source {
  document: string;
  section: string;
}

interface Recommendation {
  protocol?: string;
  regimen?: string;
  contraindications?: string[];
  additional_tests?: string[];
  notes?: string;
}

interface ResultData {
  found: boolean;
  recommendation?: Recommendation;
  sources?: Source[];
  disclaimer?: string;
  message?: string;
}

interface ResultPanelProps {
  loading: boolean;
  result: ResultData | null;
}

const ResultPanel = ({ loading, result }: ResultPanelProps) => {
  if (loading) {
    return (
      <div className="onco-card flex flex-col items-center justify-center py-16 text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-foreground">Querying knowledge base...</h3>
        <p className="text-sm text-muted-foreground mt-2">Retrieving relevant guidelines · Running local model</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="onco-card flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground">Ready for query</h3>
        <p className="text-sm text-muted-foreground mt-2">Fill out the patient form and submit to get recommendations</p>
      </div>
    );
  }

  if (!result.found) {
    return (
      <div className="onco-warning-card">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground">No matching guidelines found</h3>
            <p className="text-sm text-muted-foreground mt-2">{result.message || "No relevant information was found in the indexed documents."}</p>
            <p className="text-xs text-muted-foreground mt-3">Tip: Try uploading relevant guidelines in the Documents tab.</p>
          </div>
        </div>
      </div>
    );
  }

  const rec = result.recommendation;

  return (
    <div className="space-y-4">
      <div className="onco-success-card space-y-5">
        {rec?.protocol && (
          <div>
            <span className="onco-label">Applicable Protocol</span>
            <p className="text-foreground">{rec.protocol}</p>
          </div>
        )}

        {rec?.regimen && (
          <div>
            <span className="onco-label">Recommended Regimen</span>
            <pre className="bg-background rounded-lg p-3 text-sm text-foreground font-mono whitespace-pre-wrap">{rec.regimen}</pre>
          </div>
        )}

        {rec?.contraindications && rec.contraindications.length > 0 && (
          <div>
            <span className="onco-label">Key Contraindications</span>
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
              {rec.contraindications.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}

        {rec?.additional_tests && rec.additional_tests.length > 0 && (
          <div>
            <span className="onco-label">Additional Tests</span>
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
              {rec.additional_tests.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        )}

        {rec?.notes && (
          <div>
            <span className="onco-label">Clinical Notes</span>
            <p className="text-sm text-foreground">{rec.notes}</p>
          </div>
        )}
      </div>

      {result.sources && result.sources.length > 0 && (
        <div>
          <span className="onco-label">Sources</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {result.sources.map((s, i) => (
              <span key={i} className="onco-badge">{s.document} · {s.section}</span>
            ))}
          </div>
        </div>
      )}

      {result.disclaimer && (
        <p className="text-xs text-muted-foreground italic">{result.disclaimer}</p>
      )}
    </div>
  );
};

export default ResultPanel;
