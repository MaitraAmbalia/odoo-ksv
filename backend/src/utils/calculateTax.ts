export type TaxType = 'GST_INTRA' | 'GST_INTER';

export interface TaxResult {
  cgst: number;
  sgst: number;
  igst: number;
  gstAmount: number;  // total tax regardless of type
  grandTotal: number;
}

export const calculateGST = (
  subtotal: number,
  gstRate: number,
  taxType: TaxType
): TaxResult => {
  const round2 = (n: number) => Math.round(n * 100) / 100;

  if (taxType === 'GST_INTRA') {
    const half = round2((subtotal * (gstRate / 2)) / 100);
    return { cgst: half, sgst: half, igst: 0, gstAmount: round2(half * 2), grandTotal: round2(subtotal + half * 2) };
  }
  const igst = round2((subtotal * gstRate) / 100);
  return { cgst: 0, sgst: 0, igst, gstAmount: igst, grandTotal: round2(subtotal + igst) };
};
