import { useState, useEffect } from "react";
import FileUpload from "../components/FileUpload";
import { FileText, Trash2, RefreshCw } from "lucide-react";

const API_BASE = "http://localhost:8000";

interface DocInfo {
  filename: string;
  chunks: number;
}

const DocumentsPage = () => {
  const [documents, setDocuments] = useState<DocInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch {
      // Backend not available
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const deleteDoc = async (filename: string) => {
    try {
      await fetch(`${API_BASE}/document/${encodeURIComponent(filename)}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.filename !== filename));
    } catch { /* ignore */ }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="onco-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">Upload Documents</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Upload clinical guidelines, protocols, or research papers. Supported formats: PDF, DOCX, CSV, XLSX, TXT, MD.
        </p>
        <FileUpload onUploadComplete={fetchDocs} />
      </div>

      <div className="onco-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Indexed Documents</h2>
          <button onClick={fetchDocs} className="onco-btn-secondary flex items-center gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents indexed yet. Upload some above.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.filename} className="flex items-center justify-between bg-secondary rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.filename}</p>
                    <p className="text-xs text-muted-foreground">{doc.chunks} chunks indexed</p>
                  </div>
                </div>
                <button onClick={() => deleteDoc(doc.filename)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
