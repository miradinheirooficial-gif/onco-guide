from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from pathlib import Path
import chromadb
import httpx
import aiofiles

app = FastAPI(title="OncoAssist API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection("oncology_docs")

SYSTEM_PROMPT = """You are OncoAssist, a clinical decision-support assistant.

RULES:
1. ONLY use information from the document context provided.
2. NEVER invent drug names, doses, or protocols not in the documents.
3. Cite the source document and section for every recommendation.
4. If the answer is not in the documents, set found=false.
5. Always end with a disclaimer about clinical judgment.

Respond ONLY with valid JSON in this exact format:
{
  "found": true,
  "recommendation": {
    "protocol": "string",
    "regimen": "string",
    "contraindications": ["string"],
    "additional_tests": ["string"],
    "notes": "string"
  },
  "sources": [{"document": "string", "section": "string"}],
  "disclaimer": "string"
}
"""

class PatientQuery(BaseModel):
    cancer_type: str
    histology: Optional[str] = ""
    stage: str
    biomarkers: Optional[str] = ""
    ecog: Optional[str] = ""
    age_sex: Optional[str] = ""
    comorbidities: Optional[str] = ""
    prior_treatments: Optional[str] = "None"
    current_medications: Optional[str] = ""
    extra_params: Optional[list[dict]] = []
    query: str

class QueryResponse(BaseModel):
    found: bool
    recommendation: Optional[dict] = None
    sources: Optional[list[dict]] = None
    disclaimer: Optional[str] = None
    message: Optional[str] = None

@app.get("/health")
async def health():
    model = "llama3"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get("http://localhost:11434/api/tags")
            models = [m["name"] for m in r.json().get("models", [])]
            if models:
                model = models[0]
            ollama_ok = True
    except Exception:
        ollama_ok = False
    return {"ollama": ollama_ok, "model": model, "documents": collection.count()}

@app.post("/query", response_model=QueryResponse)
async def query(patient: PatientQuery):
    try:
        search_text = f"{patient.cancer_type} {patient.stage} {patient.histology} {patient.biomarkers} {patient.query}"
        results = collection.query(query_texts=[search_text], n_results=5)

        if not results["documents"] or not results["documents"][0]:
            return QueryResponse(found=False, message="No relevant documents found. Upload clinical guidelines first.")

        context = "\n\n---\n\n".join(
            f"[Source: {m['filename']} — {m['section']}]\n{doc}"
            for doc, m in zip(results["documents"][0], results["metadatas"][0])
        )

        extras = ""
        if patient.extra_params:
            extras = "\n".join(f"- {p.get('label','')}: {p.get('value','')}" for p in patient.extra_params)

        user_prompt = f"""Patient Profile:
- Cancer: {patient.cancer_type}
- Histology: {patient.histology}
- Stage: {patient.stage}
- Biomarkers: {patient.biomarkers}
- ECOG: {patient.ecog}
- Age/Sex: {patient.age_sex}
- Comorbidities: {patient.comorbidities}
- Prior treatments: {patient.prior_treatments}
- Current medications: {patient.current_medications}
{f"- Additional: {extras}" if extras else ""}

Clinical Question: {patient.query}

Document Context:
{context}"""

        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                "http://localhost:11434/api/chat",
                json={
                    "model": "llama3",
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    "stream": False,
                    "format": "json",
                },
            )

        import json
        result = json.loads(response.json()["message"]["content"])
        return QueryResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e), "type": type(e).__name__})

@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    upload_dir = Path("./uploads")
    upload_dir.mkdir(exist_ok=True)
    temp_path = upload_dir / file.filename

    async with aiofiles.open(temp_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    try:
        from indexer import index_document
        chunks = index_document(str(temp_path), file.filename, collection)
        return {"status": "success", "filename": file.filename, "chunks": chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e), "type": type(e).__name__})
    finally:
        temp_path.unlink(missing_ok=True)

@app.delete("/document/{filename}")
async def delete_document(filename: str):
    try:
        results = collection.get(where={"filename": filename})
        if results["ids"]:
            collection.delete(ids=results["ids"])
        return {"status": "deleted", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e), "type": type(e).__name__})

@app.get("/documents")
async def list_documents():
    try:
        all_docs = collection.get()
        doc_counts = {}
        for m in all_docs["metadatas"]:
            fn = m["filename"]
            doc_counts[fn] = doc_counts.get(fn, 0) + 1
        return {"documents": [{"filename": k, "chunks": v} for k, v in doc_counts.items()]}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e), "type": type(e).__name__})
