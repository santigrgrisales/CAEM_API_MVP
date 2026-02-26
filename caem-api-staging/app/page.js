"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const router = useRouter();

  useEffect(() => {
    const storedKey = localStorage.getItem("apiKey");
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  function handleConnect(e) {
    e.preventDefault();
    localStorage.setItem("apiKey", apiKey);
    router.push("/screening");
  }

  return (
    <div>
      <h1>Bank API Staging</h1>
      <form onSubmit={handleConnect}>
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter API Key"
        />
        <button type="submit">Connect</button>
      </form>
    </div>
  );
}