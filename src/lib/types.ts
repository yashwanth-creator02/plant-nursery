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

export type BusinessSettings = {
  id?: string;
  version: number;
  businessName: string;
  subheading1: string;
  subheading2: string;
  address: string;
  mobiles: string;
  gstin: string;
  updatedAt?: string;
};

export type InvoiceRecord = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerDetails: string;
  notes: string;
  status: "draft" | "final";
  version: number;
  headerSnapshot?: string | null;
  total: string;
  paymentMode?: "cash" | "online";
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
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function numberToIndianWords(n: number): string {
  if (isNaN(n) || n <= 0) return "";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convert(num: number): string {
    let str = "";
    if (num >= 10000000) {
      str += convert(Math.floor(num / 10000000)) + " Crore ";
      num %= 10000000;
    }
    if (num >= 100000) {
      str += convert(Math.floor(num / 100000)) + " Lakh ";
      num %= 100000;
    }
    if (num >= 1000) {
      str += convert(Math.floor(num / 1000)) + " Thousand ";
      num %= 1000;
    }
    if (num >= 100) {
      str += convert(Math.floor(num / 100)) + " Hundred ";
      num %= 100;
    }
    if (num > 0) {
      if (num < 20) {
        str += ones[num] + " ";
      } else {
        str += tens[Math.floor(num / 10)] + " ";
        if (num % 10 > 0) {
          str += ones[num % 10] + " ";
        }
      }
    }
    return str.trim();
  }

  const whole = Math.floor(n);
  const paise = Math.round((n - whole) * 100);

  let result = convert(whole) + " Rupees";
  if (paise > 0) {
    result += " and " + convert(paise) + " Paise";
  }
  return result + " Only";
}
