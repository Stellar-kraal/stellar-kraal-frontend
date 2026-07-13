const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

let authToken: string | null = null;

export function setToken(token: string) { authToken = token; }
export function clearToken() { authToken = null; }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(init.headers as Record<string, string> ?? {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Auth
export const login = (body: { publicKey: string; signedTxXdr: string; role: string }) =>
  request<{ token: string; role: string }>('/api/auth/login', {
    method: 'POST', body: JSON.stringify(body),
  });

// Livestock
export const getMyKraal = () => request<LivestockItem[]>('/api/livestock/my-kraal');
export const registerAnimal = (body: AnimalInput) =>
  request<{ livestock: LivestockItem; summary: ApprisalSummary }>(
    '/api/livestock/register', { method: 'POST', body: JSON.stringify(body) }
  );

// Loans
export const getLoans = () => request<Loan[]>('/api/loans');
export const getLoan  = (id: string) => request<Loan>(`/api/loans/${id}`);

// Types
export interface LivestockItem {
  id: string; rfidTag: string; animalType: string; breed: string;
  weightKg: number; ageMonths: number; healthStatus: string;
  appraisedValue: string; verificationStatus: string; txHash?: string;
}
export interface AnimalInput {
  animalType: string; breed: string; weightKg: number;
  ageMonths: number; healthStatus: string; rfidTag: string;
}
export interface ApprisalSummary {
  grossValueUSDC: number; advanceAmountUSDC?: number;
  discountRatePct?: string; mintTxHash: string;
}
export interface Loan {
  id: string; contractLoanId: string; principal: string;
  interestRate: number; status: string;
  livestock: LivestockItem; createdAt: string;
}
