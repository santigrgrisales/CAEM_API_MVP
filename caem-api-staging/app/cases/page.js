"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import { useSearchParams } from "next/navigation";

export default function CasesPage() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids");
  const [result, setResult] = useState(null);

  useEffect(() => {
    const apiKey = localStorage.getItem("apiKey");
    const ids = idsParam ? idsParam.split(",") : [];

    if (!apiKey || ids.length === 0) return;

    apiRequest("/cases/batch", "POST", { case_ids: ids }, apiKey)
      .then(setResult)
      .catch(err => alert(err.message));
  }, []);

  return (
    <div>
      <h2>Case Detail</h2>
      <pre style={{ background: "#000", color: "#0f0", padding: 20 }}>
        {result ? JSON.stringify(result, null, 2) : "Loading..."}
      </pre>
    </div>
  );
}