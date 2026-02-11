from fastapi import FastAPI

app = FastAPI(title="Kronset API", version="0.1.0")


@app.get("/health")
def health():
    return {"ok": True, "service": "kronset-api", "version": "0.1.0"}
