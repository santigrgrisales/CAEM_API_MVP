"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const router = useRouter();

  useEffect(() => {
    const storedKey = localStorage.getItem("apiKey");
    if (storedKey) setApiKey(storedKey);
  }, []);

  function handleConnect(e) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    localStorage.setItem("apiKey", apiKey);
    router.push("/screening");
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="panel" style={{ width: '400px', textAlign: 'center' }}>
        <h1 className="h-title" style={{ marginBottom: '8px' }}>Portal Bancario</h1>
        <p className="h-sub" style={{ marginBottom: '24px' }}>Conecta tu API Key para continuar y Consultar las novedades de los Procesos</p>
        
        <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            className="input"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Ingresa tu API Key"
            type="password"
          />
          <button className="btn" type="submit" style={{ width: '100%' }}>Conectar</button>
        </form>
      </div>
    </div>
  );
}