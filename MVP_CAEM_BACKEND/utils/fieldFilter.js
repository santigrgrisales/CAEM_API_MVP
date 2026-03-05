/**
 * Field filtering utility for API responses
 * Supports dot notation for nested field selection
 * Example: "proceso.numero_oficio,demandado.nombre"
 */

/**
 * Parses a comma-separated field string with dot notation
 * Example: "proceso.numero_oficio,demandado.nombre" 
 * Returns: { proceso: Set(['numero_oficio']), demandado: Set(['nombre']) }
 */
function parseFieldsParameter(fieldsString) {
  if (!fieldsString || typeof fieldsString !== 'string') {
    return null;
  }

  const fieldMap = {};
  const fields = fieldsString.split(',').map(f => f.trim()).filter(f => f);

  for (const field of fields) {
    const parts = field.split('.');
    if (parts.length !== 2) continue; // Only accept format: category.field

    const [category, fieldName] = parts;
    if (!fieldMap[category]) {
      fieldMap[category] = new Set();
    }
    fieldMap[category].add(fieldName);
  }

  // Return null if no valid fields were parsed
  return Object.keys(fieldMap).length > 0 ? fieldMap : null;
}

/**
 * Filters an object to only include specified fields
 * Maintains the category-based structure
 * Unknown fields are safely ignored
 */
function filterCaseDetail(caseObject, fieldMap) {
  if (!fieldMap) return caseObject; // No filtering, return full object

  const categories = ['proceso', 'demandado', 'demandante', 'remitente'];
  const filtered = { case_id: caseObject.case_id };

  for (const category of categories) {
    if (fieldMap[category]) {
      // Only include the category if it has requested fields
      filtered[category] = {};
      const allowedFields = fieldMap[category];

      // Add only the requested fields that exist in the category
      for (const field of allowedFields) {
        if (field in caseObject[category]) {
          filtered[category][field] = caseObject[category][field];
        }
        // Silently ignore unknown fields
      }
    }
  }

  return filtered;
}

/**
 * Get all available fields grouped by category
 * Used by frontend to populate field selector
 */
function getAllAvailableFields() {
  return {
    proceso: [
      'id',
      'numero_oficio',
      'fecha_oficio',
      'fecha_recepcion',
      'titulo_embargo',
      'titulo_orden',
      'monto_a_embargar'
    ],
    demandado: [
      'nombre',
      'documento',
      'tipo_documento'
    ],
    demandante: [
      'nombre',
      'documento',
      'tipo_documento'
    ],
    remitente: [
      'nombre',
      'ciudad',
      'direccion',
      'correo_electronico',
      'nombre_personal'
    ]
  };
}

module.exports = {
  parseFieldsParameter,
  filterCaseDetail,
  getAllAvailableFields
};
