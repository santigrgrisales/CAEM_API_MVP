"use client";

import React, { useState } from "react";

export default function ScreeningTable({ data = [], selected = new Set(), onToggle, onToggleAll, loading }) {
  const [searchTerm, setSearchTerm] = useState("");

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

  if (loading && data.length === 0) return <div className="empty">Cargando registros...</div>;

  return (
    <div>
      <input 
        type="text" 
        className="input" 
        placeholder="Buscar por Case ID, Demandado o Entidad..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: "16px" }}
      />

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
            <tr><td colSpan="5" className="empty">No se encontraron resultados</td></tr>
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