import hashlib
import fitz  # PyMuPDF
from docx import Document
import pandas as pd
from pathlib import Path

def chunk_text(text, chunk_size=800, overlap=150):
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_size])
        if len(chunk.strip()) >= 50:
            chunks.append(chunk)
        i += chunk_size - overlap
    return chunks

def make_id(filename, section, index, text):
    raw = f"{filename}:{section}:{index}:{text[:50]}"
    return hashlib.md5(raw.encode()).hexdigest()

def index_document(filepath: str, filename: str, collection) -> int:
    ext = Path(filepath).suffix.lower()
    sections = []

    if ext == ".pdf":
        doc = fitz.open(filepath)
        for i, page in enumerate(doc):
            text = page.get_text()
            if text.strip():
                sections.append((f"Page {i+1}", text))
        doc.close()

    elif ext == ".docx":
        doc = Document(filepath)
        current_heading = "Document"
        current_text = []
        for para in doc.paragraphs:
            if para.style.name.startswith("Heading"):
                if current_text:
                    sections.append((current_heading, "\n".join(current_text)))
                current_heading = para.text or "Section"
                current_text = []
            else:
                current_text.append(para.text)
        if current_text:
            sections.append((current_heading, "\n".join(current_text)))

    elif ext in (".csv", ".xlsx"):
        df = pd.read_csv(filepath) if ext == ".csv" else pd.read_excel(filepath)
        for i, row in df.iterrows():
            text = " | ".join(f"{col}: {val}" for col, val in row.items() if pd.notna(val))
            if text.strip():
                sections.append((f"Row {i+1}", text))

    elif ext in (".txt", ".md"):
        text = Path(filepath).read_text(encoding="utf-8", errors="ignore")
        sections.append(("Full Document", text))

    else:
        raise ValueError(f"Unsupported file type: {ext}")

    total = 0
    for section_name, text in sections:
        for idx, chunk in enumerate(chunk_text(text)):
            cid = make_id(filename, section_name, idx, chunk)
            collection.upsert(
                ids=[cid],
                documents=[chunk],
                metadatas=[{"filename": filename, "section": section_name}],
            )
            total += 1
    return total
