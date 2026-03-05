"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import { arrayToCSV, downloadCSV, flattenCaseDetail } from "../../lib/csv";
import ScreeningTable from "../../components/ScreeningTable";
import CaseDetailViewer from "../../components/CaseDetailViewer";
import FieldSelector from "../../components/FieldSelector";
import { useRouter } from "next/navigation";

export default function ScreeningPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [detailResults, setDetailResults] = useState(null);
  const [lastDetailIds, setLastDetailIds] = useState([]);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [selectedFieldsParam, setSelectedFieldsParam] = useState(null);

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

  async function consultarSeleccionados(idsArg) {
    const apiKey = localStorage.getItem("apiKey");
    const ids = idsArg || Array.from(selected);
    if (ids.length === 0) return alert("Selecciona al menos un oficio.");

    setLoading(true);
    setDetailResults(null);
    try {
      let url = "/cases/batch";
      if (selectedFieldsParam && selectedFieldsParam.trim()) {
        url += `?fields=${encodeURIComponent(selectedFieldsParam)}`;
      }
      const body = { case_ids: ids };
      const res = await apiRequest(url, "POST", body, apiKey);
      setDetailResults(res);
      setLastDetailIds(ids);
    } catch (err) {
      setError(err.message || "Error al consultar detalles");
    } finally {
      setLoading(false);
    }
  }

  // Handlers para FieldSelector
  function handleApplyFields(fieldsParam) {
    setSelectedFieldsParam(fieldsParam);
    setShowFieldSelector(false);
    // La recarga se hace en useEffect
  }
    // Recarga expedientes cuando cambian los campos seleccionados
    useEffect(() => {
      if (lastDetailIds.length > 0 && !showFieldSelector) {
        consultarSeleccionados(lastDetailIds);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFieldsParam]);
  function handleCancelFields() {
    setShowFieldSelector(false);
  }

  //Handlers Descargar CSV para ScreeningTable 
  function handleDownloadAllScreening(dataToExport) {
    if (!dataToExport || dataToExport.length === 0) {
      alert("No hay datos para exportar");
      return;
    }
    const csv = arrayToCSV(dataToExport);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `screening_export_${timestamp}.csv`);
  }

  function handleDownloadSelectedScreening() {
    const selectedData = rows.filter(row => selected.has(String(row.case_id)));
    if (selectedData.length === 0) {
      alert("No hay registros seleccionados para exportar");
      return;
    }
    const csv = arrayToCSV(selectedData);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `screening_selected_${selectedData.length}_${timestamp}.csv`);
  }

  // Handler para descargar detalles de casos seleccionados en CaseDetailViewer
  function handleDownloadAllDetails(results) {
    if (!results || results.length === 0) {
      alert("No hay detalles para exportar");
      return;
    }
    
    // Flatten todos los casos y agregar case_id como primera columna
    const flattenedResults = results.map(r => {
      const flattened = flattenCaseDetail(r);
      return { case_id: r.case_id, ...flattened };
    });
    
    const csv = arrayToCSV(flattenedResults);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `cases_details_export_${results.length}_${timestamp}.csv`);
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
          
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
            <button className="btn" onClick={() => consultarSeleccionados()} disabled={loading || selected.size === 0}>
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
              onDownloadAll={handleDownloadAllScreening}
              onDownloadSelected={handleDownloadSelectedScreening}
            />
          </div>
        </div>

        {/* Panel Derecho: Detalles */}
        <div className="panel">
          <h3 style={{ margin: 0, marginBottom: "16px", fontSize: "18px" }}>Visor de Detalles</h3>
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px", position: "relative", zIndex: 2 }}>
            <button
              className="btn"
              style={{
                padding: "12px 20px",
                fontSize: "15px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: 600,
                boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)",
                cursor: "pointer",
                outline: "none",
                transition: "background 0.2s, box-shadow 0.2s"
              }}
              onClick={() => {
                setShowFieldSelector(true);
              }}
              aria-label="Seleccionar campos visibles"
              tabIndex={0}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span style={{ fontWeight: 600, letterSpacing: 0.2 }}>Seleccionar campos visibles</span>
              {selectedFieldsParam && <span style={{ fontSize: '13px', color: '#22c55e', marginLeft: 4 }}>✓</span>}
            </button>
          </div>
          {/* Panel de selección de campos, modal adaptativo */}
          {showFieldSelector && (
            <div style={{
              position: "absolute",
              top: 60,
              left: 0,
              right: 0,
              zIndex: 10,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              boxShadow: "0 8px 32px 0 rgba(0,0,0,0.12)",
              maxHeight: "60vh",
              overflowY: "auto",
              padding: 0,
              margin: "0 auto 16px auto",
              width: "min(420px, 95vw)",
              minWidth: 320,
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch"
            }}>
              <FieldSelector
                onApply={handleApplyFields}
                onCancel={handleCancelFields}
                selectedFieldsParam={selectedFieldsParam}
              />
            </div>
          )}
          <div className="panel-content">
            {detailResults ? (
              <CaseDetailViewer
                results={detailResults.results || []}
                onDownloadAll={handleDownloadAllDetails}
                selectedFieldsParam={selectedFieldsParam}
              />
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
