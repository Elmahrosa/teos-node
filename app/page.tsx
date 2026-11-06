"use client";
import React, { useState, useEffect } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div style={{background: "#fff", color: "#000", minHeight: "100vh", padding: 40}}>Loading TEOS Node...</div>;

  return (
    <div style={{background: "#ffffff", color: "#000000", minHeight: "100vh", padding: 40, fontFamily: "sans-serif"}}>
      <h1 style={{fontSize: 32, fontWeight: "bold"}}>TEOS Sovereign Gateway</h1>
      <p style={{marginTop: 10, fontSize: 18}}>Node is online, wallet hooks mounted safely.</p>
      <a href="/privacy" style={{color: "#b45309", display: "block", marginTop: 20}}>Go to Privacy Policy</a>
    </div>
  );
}
