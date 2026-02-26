// components/ScreeningTable.js
"use client";

import React from "react";

/**
 * Props:
 * - data: array rows [{ case_id, tipo_id_demandado, id_demandado, tipo_orden, fecha_recepcion, entidad_remitente }]
 * - selected: Set or array of selected ids
 * - onToggle(id)
 * - onToggleAll()
 */
export default function ScreeningTable({ data = [], selected = new Set(), onToggle, onToggleAll }) {
  const allSelected = data.length > 0 && data.every(r => selected.has(String(r.case_id)));

  return (
    <div className="card">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div><strong>Oficios dirigidos</strong> <span className="small">({data.length})</span></div>
        <div className="small">Click en fila para ver detalles individuales (opcional)</div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th style={{ width:40 }}>
              <input type="checkbox" checked={allSelected} onChange={onToggleAll} aria-label="select all" />
            </th>
            <th>Case ID</th>
            <th>Tipo ID</th>
            <th>ID Demandado</th>
            <th>Tipo Orden</th>
            <th>Fecha recepción</th>
            <th>Entidad remitente</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr><td colSpan="7" className="empty">No hay registros</td></tr>
          )}
          {data.map(row => {
            const id = String(row.case_id);
            const checked = selected.has(id);
            return (
              <tr key={id} className="row-clickable">
                <td>
                  <input type="checkbox" checked={checked} onChange={() => onToggle(id)} />
                </td>
                <td>{row.case_id}</td>
                <td>{row.tipo_id_demandado || '-'}</td>
                <td>{row.id_demandado || '-'}</td>
                <td>{row.tipo_orden || '-'}</td>
                <td>{row.fecha_recepcion || '-'}</td>
                <td>{row.entidad_remitente || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}