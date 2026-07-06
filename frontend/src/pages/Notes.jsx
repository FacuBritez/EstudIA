import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import "./Notes.css";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [user, setUser] = useState(null);
  const [pdfStatus, setPdfStatus] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [loadingQuizId, setLoadingQuizId] = useState(null);
  const [loadingSummaryId, setLoadingSummaryId] = useState(null);
  const [summaries, setSummaries] = useState({});
  const [actionErrors, setActionErrors] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/");
        return;
      }

      setUser(user);
      fetchNotes(user.id);
    }

    load();
  }, [navigate]);

  async function fetchNotes(userId) {
    if (!userId) return;

    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setNotes(data || []);
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  async function createNote() {
    if (!title || !content || !user) return;

    await supabase.from("notes").insert([
      {
        title,
        content,
        user_id: user.id,
      },
    ]);

    setTitle("");
    setContent("");

    fetchNotes(user.id);
  }

  async function deleteNote(id) {
    await supabase.from("notes").delete().eq("id", id);
    fetchNotes(user.id);
  }

  async function updateNote(id) {
    await supabase.from("notes").update({ title, content }).eq("id", id);

    setTitle("");
    setContent("");
    setEditingId(null);
    fetchNotes(user.id);
  }

  function startEdit(note) {
    setTitle(note.title);
    setContent(note.content);
    setEditingId(note.id);
  }

  function cancelEdit() {
    setTitle("");
    setContent("");
    setEditingId(null);
  }

  async function generateQuiz(note) {
    setActionErrors((current) => ({ ...current, [note.id]: "" }));
    setLoadingQuizId(note.id);

    try {
      const res = await fetch("http://localhost:3000/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: note.content }),
      });

      if (!res.ok) {
        throw new Error("Quiz request failed");
      }

      const data = await res.json();

      navigate("/quiz", { state: { quiz: data } });
    } catch {
      setActionErrors((current) => ({
        ...current,
        [note.id]: "No se pudo generar la trivia. Revisa el backend e intenta otra vez.",
      }));
    } finally {
      setLoadingQuizId(null);
    }
  }

  async function generateSummary(note) {
    setActionErrors((current) => ({ ...current, [note.id]: "" }));
    setLoadingSummaryId(note.id);

    try {
      const res = await fetch("http://localhost:3000/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: note.content }),
      });

      if (!res.ok) {
        throw new Error("Summary request failed");
      }

      const data = await res.json();

      setSummaries((current) => ({
        ...current,
        [note.id]: data.summary,
      }));
    } catch {
      setActionErrors((current) => ({
        ...current,
        [note.id]: "No se pudo generar el resumen. Intente nuevamente.",
      }));
    } finally {
      setLoadingSummaryId(null);
    }
  }

  async function importPdf(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setPdfError("");
    setPdfStatus("Leyendo PDF...");

    try {
      const [{ default: pdfWorker }, pdfjsLib] = await Promise.all([
        import("pdfjs-dist/build/pdf.worker.mjs?url"),
        import("pdfjs-dist"),
      ]);

      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const pageTexts = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => item.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        if (pageText) {
          pageTexts.push(pageText);
        }
      }

      const extractedText = pageTexts.join("\n\n").trim();

      if (!extractedText) {
        setPdfStatus("");
        setPdfError("No pude extraer texto. Puede ser un PDF escaneado.");
        return;
      }

      const fileTitle = file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
      setTitle((currentTitle) => currentTitle || fileTitle);
      setContent((currentContent) =>
        currentContent
          ? `${currentContent.trim()}\n\n${extractedText}`
          : extractedText,
      );
      setPdfStatus(`PDF importado: ${pdf.numPages} paginas.`);
    } catch {
      setPdfStatus("");
      setPdfError("No se pudo leer el PDF. Proba con otro archivo.");
    }
  }

  return (
    <main className="notes-shell">
      <header className="notes-header">
        <div>
          <p className="eyebrow">Espacio de estudio</p>
          <h1>Mis apuntes</h1>
        </div>
        <button className="logout-btn" onClick={logout}>
          Salir
        </button>
      </header>

      <section className="notes-layout">
        <aside className="note-form" aria-label="Editor de apuntes">
          <div className="form-heading">
            <div>
              <h2>{editingId ? "Editar apunte" : "Nuevo apunte"}</h2>
              <p>
                {editingId
                  ? "Actualiza el contenido guardado."
                  : "Guarda una idea, tema o resumen."}
              </p>
            </div>
          </div>

          <label>
            <span>Titulo</span>
            <input
              placeholder="Ej. Revolucion industrial"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label>
            <span>Contenido</span>
            <textarea
              placeholder="Escribe o pega tus apuntes..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </label>

          <div className="pdf-import">
            <label className="pdf-import-control">
              <span>Importar PDF</span>
              <input type="file" accept="application/pdf" onChange={importPdf} />
            </label>
            {pdfStatus && <p className="pdf-status">{pdfStatus}</p>}
            {pdfError && <p className="pdf-error">{pdfError}</p>}
          </div>

          <div className="form-actions">
            {editingId ? (
              <>
                <button
                  className="btn-primary"
                  onClick={() => updateNote(editingId)}
                >
                  Guardar cambios
                </button>
                <button className="btn-secondary" onClick={cancelEdit}>
                  Cancelar
                </button>
              </>
            ) : (
              <button className="btn-primary" onClick={createNote}>
                Crear apunte
              </button>
            )}
          </div>
        </aside>

        <div className="notes-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Biblioteca</p>
              <h2>
                {notes.length} {notes.length === 1 ? "apunte" : "apuntes"}
              </h2>
            </div>
          </div>

          <div className="note-list">
            {notes.length === 0 ? (
              <div className="empty-state">
                <h3>Todavia no hay apuntes</h3>
                <p>Crea el primero para empezar a generar trivias.</p>
              </div>
            ) : (
              notes.map((note) => (
                <article key={note.id} className="note-card">
                  {loadingQuizId === note.id && (
                    <div className="loading-overlay">
                      <span className="spinner" aria-hidden="true" />
                      Generando trivia...
                    </div>
                  )}
                  <div className="note-card-header">
                    <h3>{note.title}</h3>
                  </div>
                  <p>{note.content}</p>
                  {summaries[note.id] && (
                    <div className="summary-box">
                      <h4>Resumen</h4>
                      <p>{summaries[note.id]}</p>
                    </div>
                  )}
                  {actionErrors[note.id] && (
                    <p className="action-error">{actionErrors[note.id]}</p>
                  )}
                  <div className="note-actions">
                    <button
                      className="btn-success"
                      disabled={loadingQuizId === note.id}
                      onClick={() => generateQuiz(note)}
                    >
                      {loadingQuizId === note.id ? (
                        <>
                          <span className="spinner" aria-hidden="true" />
                          Generando...
                        </>
                      ) : (
                        "Generar trivia"
                      )}
                    </button>
                    <button
                      className="btn-primary"
                      disabled={loadingSummaryId === note.id}
                      onClick={() => generateSummary(note)}
                    >
                      {loadingSummaryId === note.id ? (
                        <>
                          <span className="spinner" aria-hidden="true" />
                          Resumiendo...
                        </>
                      ) : (
                        "Generar resumen"
                      )}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => startEdit(note)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => deleteNote(note.id)}
                    >
                      Borrar
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
