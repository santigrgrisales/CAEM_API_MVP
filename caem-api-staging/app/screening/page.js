
"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import ScreeningTable from "../../components/ScreeningTable";
import CaseDetailViewer from "../../components/CaseDetailViewer";
import { useRouter } from "next/navigation";

export default function ScreeningPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [detailResults, setDetailResults] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const apiKey = localStorage.getItem("apiKey");
    if (!apiKey) {
      router.push("/");
      return;
    }

    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest("/screening", "GET", null, apiKey);
        // data expected as array
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Error fetching screening");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (rows.length === 0) return;
    const all = rows.every(r => selected.has(String(r.case_id)));
    if (all) setSelected(new Set());
    else setSelected(new Set(rows.map(r => String(r.case_id))));
  }

  async function consultarSeleccionados() {
    const apiKey = localStorage.getItem("apiKey");
    if (!apiKey) return alert("Sin API Key. Vuelve a conectar.");

    const ids = Array.from(selected);
    if (ids.length === 0) return alert("Selecciona al menos un case_id.");

    setLoading(true);
    setError(null);
    setDetailResults(null);
    try {
      const res = await apiRequest("/cases/batch", "POST", { case_ids: ids }, apiKey);
      // res: { results, not_found }
      setDetailResults(res);
    } catch (err) {
      setError(err.message || "Error en batch");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display:"grid", gap:14 }}>
      <div className="card">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <h3 style={{ margin:0 }}>Lista de oficios dirigidos a este banco.</h3>
          </div>

          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button className="btn secondary" onClick={() => { localStorage.removeItem("apiKey"); router.push("/"); }}>Desconectar</button>
          </div>
        </div>

        <div style={{ marginTop:12 }}>
          {error && <div style={{ color:"var(--danger)", marginBottom:8 }}>{error}</div>}
          <div className="controls">
            <div className="small">Seleccionados: <strong>{selected.size}</strong></div>
            <button className="btn" onClick={consultarSeleccionados} disabled={loading || selected.size===0}>{loading ? "Consultando..." : "Consultar seleccionados"}</button>
            <button className="btn secondary" onClick={() => { setSelected(new Set()); setDetailResults(null); }}>Limpiar selección</button>
          </div>

          {loading && rows.length === 0 ? (<div className="small">Cargando...</div>) : null}

          <ScreeningTable data={rows} selected={selected} onToggle={toggle} onToggleAll={toggleAll} />
        </div>
      </div>

      <div className="card">
        <h4>Detalles</h4>
        {detailResults ? (
          <>
            {detailResults.not_found && detailResults.not_found.length > 0 && (
              <div className="small" style={{ marginBottom:8 }}>No encontrados: {detailResults.not_found.join(", ")}</div>
            )}
            <CaseDetailViewer results={detailResults.results || []} />
            <div style={{ marginTop:8 }}>
              <button className="btn" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(detailResults, null, 2)); alert("Copiado JSON completo"); }}>Copiar JSON completo</button>
            </div>
          </>
        ) : (
          <div className="empty">No hay detalles cargados. Selecciona casos y presiona <strong>Consultar seleccionados</strong>.</div>
        )}
      </div>
    </div>
  );
}