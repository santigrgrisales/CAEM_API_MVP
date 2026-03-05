"use client";

import { Suspense, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import { useSearchParams } from "next/navigation";
import CaseDetailViewer from "../../components/CaseDetailViewer";
import { arrayToCSV, downloadCSV } from "../../lib/csv";

function CasesContent() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids");
  const [result, setResult] = useState(null);
  const [selectedFieldsParam, setSelectedFieldsParam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [error, setError] = useState(null);

  // DEBUG: Component mount
  console.log("[DEBUG] CasesContent mounted");
  console.log("[DEBUG] idsParam:", idsParam);
  console.log("[DEBUG] selectedFieldsParam:", selectedFieldsParam);

  /**
   * Fetch case details with optional field filtering
   */
  const fetchCaseDetails = async (fieldsParam = null) => {
    const apiKey = localStorage.getItem("apiKey");
    const ids = idsParam ? idsParam.split(",") : [];

    if (!apiKey || ids.length === 0) {
      console.warn("No apiKey or no ids provided, skipping fetchCaseDetails.", { apiKey: !!apiKey, idsLength: ids.length });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build the API path with fields parameter if provided
      const path = fieldsParam 
        ? `/cases/batch?fields=${encodeURIComponent(fieldsParam)}`
        : '/cases/batch';

      console.log("[DEBUG] Fetching cases -> path:", path, "ids:", ids);
      const data = await apiRequest(path, "POST", { case_ids: ids }, apiKey);
      console.log("[DEBUG] Fetch result:", data && typeof data === 'object' ? { resultsCount: (data.results || []).length } : data);
      setResult(data);
    } catch (err) {
      setError(err.message || "Unknown error");
      console.error('[DEBUG] Error fetching cases:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initial load - fetch cases with field filtering
   */
  useEffect(() => {
    console.log("[DEBUG] useEffect executed", { idsParam, selectedFieldsParam });
    fetchCaseDetails(selectedFieldsParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsParam, selectedFieldsParam]);

  /**
   * Handle field selection from FieldSelector
   */
  const handleApplyFields = (fieldsParam) => {
    setSelectedFieldsParam(fieldsParam);
    setShowFieldSelector(false);
    // useEffect will trigger fetch with the new selectedFieldsParam
  };

  /**
   * Handle cancel field selection
   */
  const handleCancelFields = () => {
    setShowFieldSelector(false);
  };

  /**
   * Handle download all cases as CSV
   */
  const handleDownloadAll = (results) => {
    const csv = arrayToCSV(results);
    downloadCSV(csv, 'all_cases_details.csv');
  };

  const idsParam_list = idsParam ? idsParam.split(",") : [];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0' }}>Detalle de Expedientes</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
          {idsParam_list.length} expediente(s) solicitado(s)
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '14px'
        }}>
          Cargando expedientes...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fee',
          borderLeft: '4px solid #c33',
          color: '#c33',
          borderRadius: '4px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results with field selector logic handled inside CaseDetailViewer */}
      {result && !loading && (
        <CaseDetailViewer
          results={result.results || []}
          onDownloadAll={handleDownloadAll}
          onApplyFields={handleApplyFields}
          onCancelFields={handleCancelFields}
          showFieldSelector={showFieldSelector}
          setShowFieldSelector={setShowFieldSelector}
          selectedFieldsParam={selectedFieldsParam}
        />
      )}

      {/* No Data State */}
      {!result && !loading && !error && (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '14px'
        }}>
          Especifica los IDs de expedientes para ver el detalle
        </div>
      )}
    </div>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div style={{ padding: '24px' }}>Cargando...</div>}>
      <CasesContent />
    </Suspense>
  );
}