"use client";
import { useState, useEffect } from "react";
import { getT, type Lang } from "@/lib/i18n";

export function useT() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const saved = (localStorage.getItem("lang") as Lang) ?? "en";
    setLang(saved);
  }, []);

  return getT(lang);
}
