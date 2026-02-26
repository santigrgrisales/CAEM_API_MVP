// components/CaseDetailViewer.js
"use client";

import { useState } from "react";

/**
 * Props:
 * - results: array of { case_id, proceso, demandado, demandante, remitente }
 */
export default function CaseDetailViewer({ results = [] }) {
  const [open, setOpen] = useState({}); // map case_id -> boolean

  if (!results || results.length === 0) {
    return <div className="card"><div className="empty">No hay detalles para mostrar. Selecciona registros y haz "Consultar seleccionados".</div></div>;
  }

  const toggle = (caseId) => {
    setOpen(prev => ({ ...prev, [caseId]: !prev[caseId] }));
  };

  const renderKV = (obj) => {
    if (!obj) return <div className="small">-</div>;
    const entries = Object.entries(obj);
    return (
      <table className="kv-table">
        <tbody>
          {entries.map(([k,v]) => (
            <tr key={k}>
              <td className="kv-key">{k}</td>
              <td>{v === null || v === undefined ? '-' : String(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="viewer">
      {results.map(r => {
        const cid = r.case_id;
        return (
          <div key={cid} className="case-card">
            <div className="case-header">
              <div>
                <div style={{ fontWeight:700 }}>{cid}</div>
                <div className="small">Resumen: {r.proceso?.titulo_embargo || r.proceso?.titulo_orden || '-'}</div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <button className="toggle-btn" onClick={() => toggle(cid)}>{open[cid] ? "Contraer" : "Expandir"}</button>
              </div>
            </div>

            {open[cid] && (
              <div style={{ marginTop:12 }}>
                <details open style={{ marginBottom:10 }}><summary style={{ fontWeight:700 }}>1. Identificación del proceso</summary>
                  <div style={{ marginTop:8 }}>{renderKV(r.proceso)}</div>
                </details>

                <details style={{ marginBottom:10 }}><summary style={{ fontWeight:700 }}>2. Demandado</summary>
                  <div style={{ marginTop:8 }}>{renderKV(r.demandado)}</div>
                </details>

                <details style={{ marginBottom:10 }}><summary style={{ fontWeight:700 }}>3. Demandante</summary>
                  <div style={{ marginTop:8 }}>{renderKV(r.demandante)}</div>
                </details>

                <details style={{ marginBottom:10 }}><summary style={{ fontWeight:700 }}>4. Remitente</summary>
                  <div style={{ marginTop:8 }}>{renderKV(r.remitente)}</div>
                </details>

                <div style={{ marginTop:10 }}>
                  <button className="btn secondary" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(r, null, 2)); alert("Copiado JSON del caso"); }}>Copiar JSON</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}