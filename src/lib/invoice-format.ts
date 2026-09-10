// src/lib/invoice-format.ts

export function parseInvoiceNumber(invNum: string): {
  prefix: string;
  number: number;
  padLength: number;
} {
  const trimmed = (invNum || "").trim();
  const match = trimmed.match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const digitStr = match[2];
    return {
      prefix,
      number: parseInt(digitStr, 10),
      padLength: digitStr.length,
    };
  }

  // Fallback if no trailing digits: append -0001
  const prefix = trimmed ? `${trimmed}-` : `INV-${new Date().getFullYear()}-`;
  return {
    prefix,
    number: 1,
    padLength: 4,
  };
}

export function formatInvoiceNumber(
  prefix: string,
  number: number,
  padLength: number
): string {
  return `${prefix}${String(number).padStart(padLength, "0")}`;
}

export function incrementInvoiceNumber(invNum: string): string {
  const parsed = parseInvoiceNumber(invNum);
  return formatInvoiceNumber(parsed.prefix, parsed.number + 1, parsed.padLength);
}
