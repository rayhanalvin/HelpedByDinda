export type FeeRow = {
  id: string;
  pengajarId: string;
  pengajarNama: string;
  periode: string;
  totalJam: number;
  nominalPerJam: number;
  totalFee: number;
  status: "PENDING" | "PAID" | string;
  periodType?: "WEEKLY" | "MONTHLY";
  periodKey?: string;
  teacherBankName: string | null;
  teacherAccountNumber: string | null;
  teacherAccountName: string | null;
  payoutMethod: string | null;
  payoutReference: string | null;
  paymentProofData?: string | null;
  paymentProofName?: string | null;
  paymentProofMimeType?: string | null;
  paymentProofUploadedAt?: string | null;
};

export type ReminderLog = {
  id: string;
  userId?: string | null;
  tipe: string;
  targetNama: string;
  targetEmail: string;
  targetRole: string;
  status: string;
  errorMessage?: string | null;
  sentAt: string;
  keterangan?: string | null;
};
