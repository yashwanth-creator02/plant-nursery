"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language-context";

export default function RootPage() {
  const router = useRouter();
  const { language } = useLanguage();
  useEffect(() => {
    router.replace(`/${language}/invoice`);
  }, [router, language]);
  return null;
}
