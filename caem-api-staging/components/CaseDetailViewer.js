"use client";

import { useState } from "react";

export default function CaseDetailViewer({ results = [] }) {
  const [activeTabMap, setActiveTabMap] = useState({}); // Mapa para saber qué tab está activo por caso

  if (!results || results.length === 0) return null;

  const renderKV = (obj) => {
    if (!obj || Object.keys(obj).length === 0) return <div className="small">Información no disponible</div>;
    return (
      <table className="kv-table">
        <tbody>
          {Object.entries(obj).map(([k, v]) => (
            <tr key={k}>
              <td className="kv-key">{k.replace(/_/g, " ").toUpperCase()}</td>
              <td>{v === null || v === undefined || v === "" ? '-' : String(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const getActiveTab = (cid) => activeTabMap[cid] || "proceso";
  const setActiveTab = (cid, tab) => setActiveTabMap(prev => ({ ...prev, [cid]: tab }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {results.map(r => {
        const cid = r.case_id;
        const currentTab = getActiveTab(cid);

        return (
          <div key={cid} style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ background: "var(--row-hover)", padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "16px", color: "var(--accent)" }}>Expediente #{cid}</h4>
              </div>
              <button 
                className="btn secondary" 
                style={{ padding: "6px 12px", fontSize: "12px" }}
                onClick={() => { navigator.clipboard?.writeText(JSON.stringify(r, null, 2)); alert("JSON Copiado"); }}
              >
                Copiar JSON
              </button>
            </div>

            <div style={{ padding: "16px" }}>
              <div className="tabs-header">
                <button className={`tab-btn ${currentTab === 'proceso' ? 'active' : ''}`} onClick={() => setActiveTab(cid, 'proceso')}>Proceso</button>
                <button className={`tab-btn ${currentTab === 'demandado' ? 'active' : ''}`} onClick={() => setActiveTab(cid, 'demandado')}>Demandado</button>
                <button className={`tab-btn ${currentTab === 'demandante' ? 'active' : ''}`} onClick={() => setActiveTab(cid, 'demandante')}>Demandante</button>
                <button className={`tab-btn ${currentTab === 'remitente' ? 'active' : ''}`} onClick={() => setActiveTab(cid, 'remitente')}>Remitente</button>
              </div>

              <div>
                {currentTab === 'proceso' && renderKV(r.proceso)}
                {currentTab === 'demandado' && renderKV(r.demandado)}
                {currentTab === 'demandante' && renderKV(r.demandante)}
                {currentTab === 'remitente' && renderKV(r.remitente)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}