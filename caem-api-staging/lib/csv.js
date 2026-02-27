

export function escapeCSVValue(value) {
  if (value === null || value === undefined) return '';
  const strValue = String(value);
  
  if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n') || strValue.includes('\r')) {
    return '"' + strValue.replace(/"/g, '""') + '"';
  }
  return strValue;
}

export function arrayToCSV(data, headers = null) {
  if (!data || data.length === 0) return '';

 
  if (!headers) {
    const allKeys = new Set();
    data.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key));
    });
    headers = Array.from(allKeys);
  }

  
  let csv = headers.map(escapeCSVValue).join(',') + '\n';

 
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      return escapeCSVValue(value);
    });
    csv += values.join(',') + '\n';
  });

  return csv;
}

export function downloadCSV(csvContent, filename) {
  
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function flattenCaseDetail(caseData) {
  const flattened = {};

 
  const categoryLabels = {
    proceso: 'PROCESO',
    demandado: 'DEMANDADO',
    demandante: 'DEMANDANTE',
    remitente: 'REMITENTE'
  };

  Object.entries(categoryLabels).forEach(([category, label]) => {
    if (caseData[category]) {
      Object.entries(caseData[category]).forEach(([key, value]) => {
        
        const formattedKey = `${label}_${key.replace(/_/g, ' ').toUpperCase()}`;
        flattened[formattedKey] = value;
      });
    }
  });

  return flattened;
}
