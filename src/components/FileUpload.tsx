import { useState, useCallback } from "react";
import { Upload, FileText, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const API_BASE = "http://localhost:8000";

const ACCEPTED_TYPES = ".pdf,.docx,.csv,.xlsx,.txt,.md";

interface UploadedFile {
  filename: string;
  chunks: number;
}

interface FileUploadProps {
  onUploadComplete?: () => void;
}

const FileUpload = ({ onUploadComplete }: FileUploadProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setSuccessMsg(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload-document`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail));
      }

      const data = await res.json();
      setFiles((prev) => [...prev.filter((f) => f.filename !== data.filename), { filename: data.filename, chunks: data.chunks }]);
      setSuccessMsg(`${data.filename} — ${data.chunks} chunks indexed`);
      onUploadComplete?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (filename: string) => {
    try {
      await fetch(`${API_BASE}/document/${encodeURIComponent(filename)}`, { method: "DELETE" });
      setFiles((prev) => prev.filter((f) => f.filename !== filename));
    } catch {
      setError("Failed to delete file");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        {uploading ? (
          <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" />
        ) : (
          <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          {uploading ? "Uploading & indexing..." : "Drag & drop or click to upload"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, CSV, XLSX, TXT, MD</p>
        <input id="file-input" type="file" accept={ACCEPTED_TYPES} onChange={handleFileSelect} className="hidden" />
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <span className="onco-label">Uploaded Documents</span>
          {files.map((f) => (
            <div key={f.filename} className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-foreground">{f.filename}</span>
                <span className="text-muted-foreground text-xs">({f.chunks} chunks)</span>
              </div>
              <button onClick={() => deleteFile(f.filename)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
