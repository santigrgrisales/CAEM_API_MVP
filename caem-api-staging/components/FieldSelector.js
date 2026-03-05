"use client";

import { useState } from "react";

const AVAILABLE_FIELDS = {
  proceso: [
    { key: 'id', label: 'ID' },
    { key: 'numero_oficio', label: 'Número de Oficio' },
    { key: 'fecha_oficio', label: 'Fecha de Oficio' },
    { key: 'fecha_recepcion', label: 'Fecha de Recepción' },
    { key: 'titulo_embargo', label: 'Título del Embargo' },
    { key: 'titulo_orden', label: 'Título de Orden' },
    { key: 'monto_a_embargar', label: 'Monto a Embargar' }
  ],
  demandado: [
    { key: 'nombre', label: 'Nombre' },
    { key: 'documento', label: 'Documento' },
    { key: 'tipo_documento', label: 'Tipo de Documento' }
  ],
  demandante: [
    { key: 'nombre', label: 'Nombre' },
    { key: 'documento', label: 'Documento' },
    { key: 'tipo_documento', label: 'Tipo de Documento' }
  ],
  remitente: [
    { key: 'nombre', label: 'Nombre' },
    { key: 'ciudad', label: 'Ciudad' },
    { key: 'direccion', label: 'Dirección' },
    { key: 'correo_electronico', label: 'Correo Electrónico' },
    { key: 'nombre_personal', label: 'Nombre de Personal' }
  ]
};

const CATEGORY_LABELS = {
  proceso: 'Proceso',
  demandado: 'Demandado',
  demandante: 'Demandante',
  remitente: 'Remitente'
};

export default function FieldSelector({ onApply, onCancel, selectedFieldsParam }) {
  // Inicializa los campos seleccionados desde el prop
  function parseSelectedFieldsParam(param) {
    // Si no hay selección previa, selecciona todos los campos por defecto
    if (!param) {
      const all = {};
      Object.keys(AVAILABLE_FIELDS).forEach(cat => {
        all[cat] = {};
        AVAILABLE_FIELDS[cat].forEach(f => {
          all[cat][f.key] = true;
        });
      });
      return all;
    }
    const fields = param.split(',').map(f => f.trim()).filter(Boolean);
    const result = {};
    fields.forEach(f => {
      const [cat, key] = f.split('.');
      if (cat && key) {
        if (!result[cat]) result[cat] = {};
        result[cat][key] = true;
      }
    });
    return result;
  }

  const [selectedFields, setSelectedFields] = useState(() => parseSelectedFieldsParam(selectedFieldsParam));
  const [isExpanded, setIsExpanded] = useState({
    proceso: true,
    demandado: true,
    demandante: true,
    remitente: true
  });

  const toggleField = (category, fieldKey) => {
    setSelectedFields(prev => {
      const categoryFields = prev[category] || {};
      const isSelected = categoryFields[fieldKey];
      
      if (isSelected) {
        const newCategoryFields = { ...categoryFields };
        delete newCategoryFields[fieldKey];
        
        if (Object.keys(newCategoryFields).length === 0) {
          const newFields = { ...prev };
          delete newFields[category];
          return newFields;
        }
        
        return { ...prev, [category]: newCategoryFields };
      } else {
        return {
          ...prev,
          [category]: { ...categoryFields, [fieldKey]: true }
        };
      }
    });
  };

  const toggleCategory = (category) => {
    setSelectedFields(prev => {
      const categoryFields = prev[category] || {};
      const allFieldsSelected = AVAILABLE_FIELDS[category].every(
        f => categoryFields[f.key]
      );

      if (allFieldsSelected) {
        const newFields = { ...prev };
        delete newFields[category];
        return newFields;
      } else {
        const allFields = {};
        AVAILABLE_FIELDS[category].forEach(f => {
          allFields[f.key] = true;
        });
        return { ...prev, [category]: allFields };
      }
    });
  };

  const isFieldSelected = (category, fieldKey) => {
    return selectedFields[category]?.[fieldKey] || false;
  };

  const areCategoryFieldsSelected = (category) => {
    return AVAILABLE_FIELDS[category].every(f => isFieldSelected(category, f.key));
  };

  const buildFieldsParameter = () => {
    const fields = [];
    for (const [category, categoryFields] of Object.entries(selectedFields)) {
      for (const fieldKey of Object.keys(categoryFields)) {
        fields.push(`${category}.${fieldKey}`);
      }
    }
    return fields.join(',');
  };

  const handleApply = () => {
    const fieldsParam = buildFieldsParameter();
    if (typeof onApply === "function") onApply(fieldsParam || null);
    // keep UI expanded state reset so next time opens consistent
    setIsExpanded({
      proceso: true,
      demandado: true,
      demandante: true,
      remitente: true
    });
  };

  const handleCancel = () => {
    setSelectedFields({});
    if (typeof onCancel === "function") onCancel();
  };

  const selectedCount = Object.values(selectedFields).reduce(
    (sum, cat) => sum + Object.keys(cat).length,
    0
  );

  return (
    <div className="field-selector-container" style={{ background: 'transparent', minWidth: 300, maxWidth: 420, width: '100%' }}>
      <div className="field-selector-header">
        <h3 style={{ margin: 0 }}>Seleccionar campos visibles</h3>
        <button 
          className="btn secondary"
          onClick={() => handleCancel()}
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          ✕
        </button>
      </div>

      <div className="field-selector-body" style={{ maxHeight: '40vh', overflowY: 'auto', background: '#f9fafb' }}>
        {Object.keys(AVAILABLE_FIELDS).map(category => (
          <div key={category} className="field-category">
            <div 
              className="field-category-header"
              onClick={() => setIsExpanded(prev => ({
                ...prev,
                [category]: !prev[category]
              }))}
            >
              <input
                type="checkbox"
                checked={areCategoryFieldsSelected(category) && Object.keys(selectedFields[category] || {}).length > 0}
                onChange={() => toggleCategory(category)}
                onClick={(e) => e.stopPropagation()}
              />
              <label onClick={(e) => e.stopPropagation()}>
                <strong>{CATEGORY_LABELS[category]}</strong>
              </label>
              <span className="expand-icon">
                {isExpanded[category] ? '▼' : '▶'}
              </span>
            </div>

            {isExpanded[category] && (
              <div className="field-category-items">
                {AVAILABLE_FIELDS[category].map(field => (
                  <div key={field.key} className="field-item">
                    <input
                      type="checkbox"
                      id={`${category}-${field.key}`}
                      checked={isFieldSelected(category, field.key)}
                      onChange={() => toggleField(category, field.key)}
                    />
                    <label htmlFor={`${category}-${field.key}`}>
                      {field.label}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="field-selector-footer" style={{ background: '#f3f4f6', borderTop: '1px solid #e5e7eb', padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="field-count">
          {selectedCount === 0 
            ? 'Selecciona campos...' 
            : `${selectedCount} campo(s) seleccionado(s)`}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn secondary"
            onClick={handleCancel}
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: 6 }}
          >
            Cancelar
          </button>
          <button 
            className="btn"
            onClick={handleApply}
            disabled={selectedCount === 0}
            style={{ 
              padding: '8px 16px', 
              fontSize: '13px',
              borderRadius: 6,
              background: selectedCount === 0 ? '#d1d5db' : '#2563eb',
              color: selectedCount === 0 ? '#888' : '#fff',
              fontWeight: 600,
              opacity: selectedCount === 0 ? 0.7 : 1,
              cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
              boxShadow: selectedCount === 0 ? 'none' : '0 2px 8px 0 rgba(37,99,235,0.08)'
            }}
          >
            Guardar selección
          </button>
        </div>
      </div>

      <style jsx>{`
        .field-selector-container {
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-secondary);
          margin-bottom: 24px;
          overflow: hidden;
        }

        .field-selector-header {
          background: var(--row-hover);
          padding: 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .field-selector-body {
          padding: 16px;
          max-height: 400px;
          overflow-y: auto;
        }

        .field-category {
          margin-bottom: 16px;
          border: 1px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
        }

        .field-category-header {
          background: var(--row-hover);
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
          border-bottom: 1px solid var(--border);
        }

        .field-category-header:hover {
          background: var(--accent-light);
        }

        .field-category-header input[type="checkbox"] {
          cursor: pointer;
          width: 16px;
          height: 16px;
        }

        .field-category-header label {
          flex: 1;
          cursor: pointer;
          margin: 0;
        }

        .expand-icon {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .field-category-items {
          padding: 12px;
          background: var(--bg);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .field-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .field-item input[type="checkbox"] {
          cursor: pointer;
          width: 16px;
          height: 16px;
        }

        .field-item label {
          cursor: pointer;
          margin: 0;
          font-size: 13px;
          color: var(--text);
        }

        .field-selector-footer {
          background: var(--row-hover);
          padding: 16px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .field-count {
          font-size: 13px;
          color: var(--text-secondary);
        }

        button:disabled {
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}