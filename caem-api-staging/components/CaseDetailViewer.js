"use client";

import { useState } from "react";
import { arrayToCSV, downloadCSV, flattenCaseDetail } from "../lib/csv";

export default function CaseDetailViewer({ results = [], onDownloadAll }) {
  const [activeTabMap, setActiveTabMap] = useState({}); // Mapa para saber qué tab está activo por caso
  const [showDropdown, setShowDropdown] = useState({});

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

  
  const handleDownloadCase = (caseData) => {
    const flattened = flattenCaseDetail(caseData);
   
    const dataWithId = [{ case_id: caseData.case_id, ...flattened }];
    const csv = arrayToCSV(dataWithId);
    downloadCSV(csv, `case_${caseData.case_id}_details.csv`);
  };

  
  const handleDownloadAll = () => {
    if (onDownloadAll) {
      onDownloadAll(results);
    }
  };

  const toggleDropdown = (cid) => {
    setShowDropdown(prev => ({ ...prev, [cid]: !prev[cid] }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Descargar Todos */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span className="small" style={{ fontSize: "14px" }}>{results.length} expediente(s) cargado(s)</span>
        <button 
          className="btn" 
          style={{ 
            padding: "8px 16px", 
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "var(--success)"
          }}
          onClick={handleDownloadAll}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar todo a CSV
        </button>
      </div>

      {results.map(r => {
        const cid = r.case_id;
        const currentTab = getActiveTab(cid);
        const isDropdownOpen = showDropdown[cid];

        return (
          <div key={cid} style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
            <div style={{ background: "var(--row-hover)", padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "16px", color: "var(--accent)" }}>Expediente #{cid}</h4>
              </div>
              
              <div style={{ display: "flex", gap: "8px", position: "relative" }}>
                <button 
                  className="btn secondary" 
                  style={{ padding: "6px 12px", fontSize: "12px" }}
                  onClick={() => { navigator.clipboard?.writeText(JSON.stringify(r, null, 2)); alert("JSON Copiado"); }}
                >
                  Copiar JSON
                </button>
                
                <button 
                  className="btn" 
                  style={{ 
                    padding: "6px 12px", 
                    fontSize: "12px",
                    background: "var(--success)"
                  }}
                  onClick={() => handleDownloadCase(r)}
                >
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ marginRight: "4px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </button>
              </div>
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
