// components/ApiKeyForm.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApiKeyForm({ initial = "" }) {
  const [apiKey, setApiKey] = useState(initial || localStorage.getItem("apiKey") || "");
  const router = useRouter();

  const connect = (e) => {
    e?.preventDefault();
    if (!apiKey) return alert("Ingresa API Key");
    localStorage.setItem("apiKey", apiKey);
    router.push("/screening");
  };

  return (
    <form className="field-row" onSubmit={connect}>
      <input className="input" placeholder="API Key" value={apiKey} onChange={(e)=>setApiKey(e.target.value)} />
      <button className="btn">Conectar</button>
    </form>
  );
}