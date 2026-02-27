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
      try {
        const data = await apiRequest("/screening", "GET", null, apiKey);
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Error obteniendo los oficios");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [router]);

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(filteredData) {
    if (filteredData.length === 0) return;
    const allSelected = filteredData.every(r => selected.has(String(r.case_id)));
    
    if (allSelected) {
      setSelected(new Set());
    } else {
      const newSet = new Set(selected);
      filteredData.forEach(r => newSet.add(String(r.case_id)));
      setSelected(newSet);
    }
  }

  async function consultarSeleccionados() {
    const apiKey = localStorage.getItem("apiKey");
    const ids = Array.from(selected);
    
    if (ids.length === 0) return alert("Selecciona al menos un oficio.");

    setLoading(true);
    setDetailResults(null);
    try {
      const res = await apiRequest("/cases/batch", "POST", { case_ids: ids }, apiKey);
      setDetailResults(res);
    } catch (err) {
      setError(err.message || "Error al consultar detalles");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="header">
        
        <button className="btn secondary" onClick={() => { localStorage.removeItem("apiKey"); router.push("/"); }}>
          Desconectar
        </button>
      </header>

      <div className="dashboard-layout">
        {/* Panel Izquierdo: Tabla y Filtros */}
        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Oficios Recibidos</h3>
            <span className="small">Seleccionados: <strong>{selected.size}</strong></span>
          </div>
          
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <button className="btn" onClick={consultarSeleccionados} disabled={loading || selected.size === 0}>
              {loading ? "Consultando..." : "Ver Detalles"}
            </button>
            <button className="btn secondary" onClick={() => setSelected(new Set())} disabled={selected.size === 0}>
              Limpiar
            </button>
          </div>

          {error && <div style={{ color: "var(--danger)", marginBottom: 8, fontSize: "14px" }}>{error}</div>}

          <div className="panel-content">
            <ScreeningTable 
              data={rows} 
              selected={selected} 
              onToggle={toggle} 
              onToggleAll={toggleAll} 
              loading={loading}
            />
          </div>
        </div>

        {/* Panel Derecho: Detalles */}
        <div className="panel">
          <h3 style={{ margin: 0, marginBottom: "16px", fontSize: "18px" }}>Visor de Detalles</h3>
          <div className="panel-content">
            {detailResults ? (
              <CaseDetailViewer results={detailResults.results || []} />
            ) : (
              <div className="empty">
                <svg style={{ width: 48, height: 48, margin: "0 auto 12px", opacity: 0.2 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Selecciona uno o más oficios en la tabla y presiona "Ver Detalles"
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}