/**
 * Deterministic test data for E2E scenarios.
 *
 * Matches the shapes expected by the frontend API layer (lib/api.ts).
 * All values are fixed so tests produce reproducible results.
 *
 * Types are defined inline to avoid path-alias issues in the e2e context.
 */

// ── Inline types matching lib/api.ts ─────────────────────────────────
interface MockLivestockItem {
  id: string; rfidTag: string; animalType: string; breed: string;
  weightKg: number; ageMonths: number; healthStatus: string;
  appraisedValue: string; verificationStatus: string; txHash?: string;
}
interface MockLoan {
  id: string; contractLoanId: string; principal: string;
  interestRate: number; status: string;
  livestock: MockLivestockItem; createdAt: string;
}

export const MOCK_LIVESTOCK: MockLivestockItem[] = [
  {
    id: 'LIV-001',
    rfidTag: 'ZA-001-2026',
    animalType: 'cattle',
    breed: 'Nguni',
    weightKg: 450,
    ageMonths: 36,
    healthStatus: 'HEALTHY',
    appraisedValue: '1500000000', // 150 USDC (7-decimal stroops)
    verificationStatus: 'VERIFIED',
    txHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
  },
  {
    id: 'LIV-002',
    rfidTag: 'ZA-002-2026',
    animalType: 'goat',
    breed: 'Boer',
    weightKg: 80,
    ageMonths: 24,
    healthStatus: 'HEALTHY',
    appraisedValue: '500000000', // 50 USDC
    verificationStatus: 'VERIFIED',
    txHash: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0a1',
  },
  {
    id: 'LIV-003',
    rfidTag: 'ZA-003-2026',
    animalType: 'cattle',
    breed: 'Hereford',
    weightKg: 550,
    ageMonths: 48,
    healthStatus: 'FAIR',
    appraisedValue: '1800000000', // 180 USDC
    verificationStatus: 'PENDING',
    txHash: undefined,
  },
  {
    id: 'LIV-004',
    rfidTag: 'ZA-004-2026',
    animalType: 'sheep',
    breed: 'Dorper',
    weightKg: 60,
    ageMonths: 18,
    healthStatus: 'HEALTHY',
    appraisedValue: '300000000', // 30 USDC
    verificationStatus: 'LOCKED',
    txHash: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0a1b2c3',
  },
];

export const MOCK_LOANS: MockLoan[] = [
  {
    id: 'LOAN-001',
    contractLoanId: 'CL-001',
    principal: '1200000000', // 120 USDC
    interestRate: 8.5,
    status: 'ACTIVE',
    livestock: MOCK_LIVESTOCK[0],
    createdAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'LOAN-002',
    contractLoanId: 'CL-002',
    principal: '400000000', // 40 USDC
    interestRate: 7.0,
    status: 'ACTIVE',
    livestock: MOCK_LIVESTOCK[1],
    createdAt: '2026-06-10T14:30:00Z',
  },
  {
    id: 'LOAN-003',
    contractLoanId: 'CL-003',
    principal: '1500000000', // 150 USDC
    interestRate: 9.0,
    status: 'REPAID',
    livestock: MOCK_LIVESTOCK[3],
    createdAt: '2026-05-15T08:00:00Z',
  },
  {
    id: 'LOAN-004',
    contractLoanId: 'CL-004',
    principal: '500000000', // 50 USDC
    interestRate: 6.5,
    status: 'LIQUIDATED',
    livestock: MOCK_LIVESTOCK[2],
    createdAt: '2026-04-20T12:00:00Z',
  },
];

export const MOCK_APPRAISAL_SUMMARY = {
  grossValueUSDC: 150.0,
  advanceAmountUSDC: 120.0,
  discountRatePct: '20.0',
  mintTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
};

export const MOCK_AUTH_RESPONSE = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHQlpYTTdZNEtZNlhH...',
  role: 'farmer',
};
