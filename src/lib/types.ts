export type StockItem = {
  id: string;
  name: string;
  unit: string | null;
  price: string;
  quantity: number;
};

export type InvoiceLineItem = {
  key: string;
  stockItemId: string | null;
  name: string;
  price: number;
  quantity: number;
};

export type InvoiceRecord = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerDetails: string;
  notes: string;
  status: "draft" | "final";
  total: string;
  createdBy: string;
  createdByUser?: { username: string };
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    stockItemId: string | null;
    name: string;
    price: string;
    quantity: number;
    lineTotal: string;
  }[];
};

export function formatMoney(n: number): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
