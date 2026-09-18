"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { InvoiceEditor } from "@/components/InvoiceEditor";
import { InvoiceRecord } from "@/lib/types";
import { useLanguage } from "@/lib/language-context";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useLanguage();
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/invoices/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Couldn't load invoice");
        if (!cancelled) setInvoice(data.invoice);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-sm text-ink-soft">{t("loadingInvoiceMsg")}</div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-8">
        <p className="mb-3 text-sm text-rust">{error || t("invoiceNotFoundMsg")}</p>
        <Link href="/invoices" className="text-sm text-pine-deep underline">
          {t("backToInvoicesBtn")}
        </Link>
      </div>
    );
  }

  return <InvoiceEditor initialInvoice={invoice} />;
}
