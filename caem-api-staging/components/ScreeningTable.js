"use client";

import React, { useState, useRef } from "react";
import { arrayToCSV, downloadCSV } from "../lib/csv";

export default function ScreeningTable({ data = [], selected = new Set(), onToggle, onToggleAll, loading, onDownloadAll, onDownloadSelected }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Lógica del buscador front-end
  const filteredData = data.filter(row => {
    const searchLower = searchTerm.toLowerCase();
    return (
      String(row.case_id).toLowerCase().includes(searchLower) ||
      String(row.id_demandado || "").toLowerCase().includes(searchLower) ||
      String(row.entidad_remitente || "").toLowerCase().includes(searchLower)
    );
  });

  const allSelected = filteredData.length > 0 && filteredData.every(r => selected.has(String(r.case_id)));
  const hasSelected = selected.size > 0;
  const hasData = data.length > 0;

  
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading && data.length === 0) return <div className="empty">Cargando registros...</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <input 
          type="text" 
          className="input" 
          placeholder="Buscar por Case ID, Demandado o Entidad..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: "1", minWidth: "200px" }}
        />
        
        {/* CSV Download Dropdown */}
        <div className="dropdown-container" ref={dropdownRef} style={{ position: "relative" }}>
          <button 
            className="btn csv-btn" 
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={!hasData}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "6px",
              background: hasData ? "var(--success)" : "var(--muted)"
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar CSV
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showDropdown && (
            <div className="dropdown-menu" style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "4px",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              boxShadow: "var(--shadow)",
              zIndex: 100,
              minWidth: "220px",
              overflow: "hidden"
            }}>
              <button 
                className="dropdown-item"
                onClick={() => {
                  onDownloadAll(filteredData);
                  setShowDropdown(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "var(--foreground)",
                  transition: "background 0.15s"
                }}
                onMouseEnter={(e) => e.target.style.background = "var(--row-hover)"}
                onMouseLeave={(e) => e.target.style.background = "none"}
              >
                {searchTerm ? `Exportar ${filteredData.length} resultados` : `Exportar todos (${data.length})`}
              </button>
              <button 
                className="dropdown-item"
                onClick={() => {
                  onDownloadSelected();
                  setShowDropdown(false);
                }}
                disabled={!hasSelected}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "none",
                  textAlign: "left",
                  cursor: hasSelected ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  color: hasSelected ? "var(--foreground)" : "var(--muted)",
                  opacity: hasSelected ? 1 : 0.5,
                  borderTop: "1px solid var(--border)"
                }}
                onMouseEnter={(e) => hasSelected && (e.target.style.background = "var(--row-hover)")}
                onMouseLeave={(e) => e.target.style.background = "none"}
              >
                Exportar seleccionados ({selected.size})
              </button>
            </div>
          )}
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>
              <input type="checkbox" checked={allSelected} onChange={() => onToggleAll(filteredData)} />
            </th>
            <th>Case ID</th>
            <th>ID Demandado</th>
            <th>Tipo ID Demandado</th>
            <th>Tipo Orden</th>
            <th>Fecha Recepción</th>
            <th>Demandante</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length === 0 && (
            <tr><td colSpan="7" className="empty">No se encontraron resultados</td></tr>
          )}
          {filteredData.map(row => {
            const id = String(row.case_id);
            const isSelected = selected.has(id);
            return (
              <tr 
                key={id} 
                className={`row-clickable ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggle(id)}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={isSelected} onChange={() => onToggle(id)} />
                </td>
                <td style={{ fontWeight: 500 }}>{row.case_id}</td>
                <td>{row.id_demandado || '-'}</td>
                <td>{row.tipo_id_demandado || '-'}</td>
                <td>{row.tipo_orden || '-'}</td>
                <td>{row.fecha_recepcion || '-'}</td>
                <td>{row.demandante || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
