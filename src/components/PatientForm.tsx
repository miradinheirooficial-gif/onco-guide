import { useState } from "react";
import { Plus, X, Send, Loader2 } from "lucide-react";

interface ExtraParam {
  id: string;
  label: string;
  value: string;
}

interface PatientFormProps {
  onSubmit: (data: Record<string, unknown>) => void;
  loading: boolean;
}

const ECOG_OPTIONS = ["0", "1", "2", "3", "4"];

const PatientForm = ({ onSubmit, loading }: PatientFormProps) => {
  const [cancerType, setCancerType] = useState("");
  const [histology, setHistology] = useState("");
  const [stage, setStage] = useState("");
  const [biomarkers, setBiomarkers] = useState("");
  const [ecog, setEcog] = useState("");
  const [ageSex, setAgeSex] = useState("");
  const [comorbidities, setComorbidities] = useState("");
  const [priorTreatments, setPriorTreatments] = useState("");
  const [currentMedications, setCurrentMedications] = useState("");
  const [query, setQuery] = useState("");
  const [extraParams, setExtraParams] = useState<ExtraParam[]>([]);

  const addParam = () =>
    setExtraParams((p) => [...p, { id: crypto.randomUUID(), label: "", value: "" }]);

  const removeParam = (id: string) =>
    setExtraParams((p) => p.filter((x) => x.id !== id));

  const updateParam = (id: string, field: "label" | "value", val: string) =>
    setExtraParams((p) => p.map((x) => (x.id === id ? { ...x, [field]: val } : x)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      cancer_type: cancerType,
      histology,
      stage,
      biomarkers,
      ecog,
      age_sex: ageSex,
      comorbidities,
      prior_treatments: priorTreatments || "None",
      current_medications: currentMedications,
      query,
      extra_params: extraParams.map(({ label, value }) => ({ label, value })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="onco-label">Cancer Type *</label>
        <input className="onco-input" placeholder="e.g. Breast cancer" value={cancerType} onChange={(e) => setCancerType(e.target.value)} required />
      </div>

      <div>
        <label className="onco-label">Histology</label>
        <input className="onco-input" placeholder="e.g. Ductal carcinoma" value={histology} onChange={(e) => setHistology(e.target.value)} />
      </div>

      <div>
        <label className="onco-label">Stage *</label>
        <input className="onco-input" placeholder="e.g. T3 N1 M0" value={stage} onChange={(e) => setStage(e.target.value)} required />
      </div>

      <div>
        <label className="onco-label">Biomarkers</label>
        <textarea className="onco-input min-h-[60px] resize-y" placeholder="e.g. HER2- / ER+ 90% / PR+ 20%" value={biomarkers} onChange={(e) => setBiomarkers(e.target.value)} />
      </div>

      <div>
        <label className="onco-label">ECOG Performance Status</label>
        <select className="onco-input" value={ecog} onChange={(e) => setEcog(e.target.value)}>
          <option value="">Select ECOG</option>
          {ECOG_OPTIONS.map((o) => (
            <option key={o} value={o}>ECOG {o}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="onco-label">Age / Sex</label>
        <input className="onco-input" placeholder="e.g. 51 / Female" value={ageSex} onChange={(e) => setAgeSex(e.target.value)} />
      </div>

      <div>
        <label className="onco-label">Comorbidities</label>
        <input className="onco-input" placeholder="e.g. Hypothyroidism" value={comorbidities} onChange={(e) => setComorbidities(e.target.value)} />
      </div>

      <div>
        <label className="onco-label">Prior Treatments</label>
        <textarea className="onco-input min-h-[60px] resize-y" placeholder="e.g. None" value={priorTreatments} onChange={(e) => setPriorTreatments(e.target.value)} />
      </div>

      <div>
        <label className="onco-label">Current Medications</label>
        <textarea className="onco-input min-h-[60px] resize-y" placeholder="e.g. Levothyroxine 100mcg qd" value={currentMedications} onChange={(e) => setCurrentMedications(e.target.value)} />
      </div>

      <div>
        <label className="onco-label">Clinical Query *</label>
        <textarea className="onco-input min-h-[100px] resize-y" placeholder="e.g. What is the recommended treatment? Are there additional tests needed?" value={query} onChange={(e) => setQuery(e.target.value)} required />
      </div>

      {/* Dynamic Extra Parameters */}
      {extraParams.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-border">
          <span className="onco-label">Custom Parameters</span>
          {extraParams.map((param) => (
            <div key={param.id} className="flex gap-2 items-start">
              <input className="onco-input flex-1" placeholder="Label" value={param.label} onChange={(e) => updateParam(param.id, "label", e.target.value)} />
              <input className="onco-input flex-1" placeholder="Value" value={param.value} onChange={(e) => updateParam(param.id, "value", e.target.value)} />
              <button type="button" onClick={() => removeParam(param.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={addParam} className="onco-btn-secondary flex items-center gap-2 text-sm w-full justify-center">
        <Plus className="w-4 h-4" /> Add Parameter
      </button>

      <button type="submit" disabled={loading} className="onco-btn-primary w-full flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {loading ? "Querying..." : "Submit Query"}
      </button>
    </form>
  );
};

export default PatientForm;
