/**
 * API Mock Handler for Playwright E2E tests.
 *
 * Intercepts all HTTP requests to the backend API and returns
 * deterministic mock data. This lets the E2E suite run without
 * a real backend, Soroban sandbox, or network connection.
 */
import type { Page } from '@playwright/test';
import {
  MOCK_LIVESTOCK,
  MOCK_LOANS,
  MOCK_APPRAISAL_SUMMARY,
  MOCK_AUTH_RESPONSE,
} from './test-data';

/** Register API route interception on the given page. */
export async function setupApiMocks(page: Page): Promise<void> {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    try {
      const handler = getHandler(url, method);
      if (handler) {
        await route.fulfill({
          status: handler.status,
          contentType: 'application/json',
          body: JSON.stringify(handler.body),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'E2E mock: unknown route' }),
        });
      }
    } catch (err) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: `E2E mock error: ${err}` }),
      });
    }
  });
}

/** Register API mocks that trigger error responses. */
export async function setupErrorApiMocks(
  page: Page,
  errorType: 'insufficient-balance' | 'server-error' | 'unauthorized',
): Promise<void> {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (errorType === 'insufficient-balance' && url.includes('/api/invoices/') && method === 'POST') {
      await route.fulfill({
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Insufficient USDC balance to fund this loan' }),
      });
      return;
    }

    if (errorType === 'server-error') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
      return;
    }

    if (errorType === 'unauthorized' && url.includes('/api/livestock/')) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized: invalid or expired token' }),
      });
      return;
    }

    // Fall through to normal handler
    const handler = getHandler(url, method);
    if (handler) {
      await route.fulfill({
        status: handler.status,
        contentType: 'application/json',
        body: JSON.stringify(handler.body),
      });
    } else {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'E2E mock: unknown route' }),
      });
    }
  });
}

// ── Route handler ─────────────────────────────────────────────────────

type MockResponse = { status: number; body: unknown };

function getHandler(url: string, method: string): MockResponse | null {
  const { pathname } = new URL(url);

  // Auth
  if (pathname === '/api/auth/login' && method === 'POST') {
    return { status: 200, body: MOCK_AUTH_RESPONSE };
  }

  // Livestock — my kraal
  if (pathname === '/api/livestock/my-kraal' && method === 'GET') {
    return { status: 200, body: MOCK_LIVESTOCK };
  }

  // Livestock — register
  if (pathname === '/api/livestock/register' && method === 'POST') {
    return {
      status: 200,
      body: { livestock: MOCK_LIVESTOCK[0], summary: MOCK_APPRAISAL_SUMMARY },
    };
  }

  // Loans — list
  if (pathname === '/api/loans' && method === 'GET') {
    return { status: 200, body: MOCK_LOANS };
  }

  // Loans — single
  if (pathname.startsWith('/api/loans/') && method === 'GET') {
    const id = pathname.replace('/api/loans/', '');
    const loan = MOCK_LOANS.find((l) => l.id === id);
    if (loan) return { status: 200, body: loan };
    return { status: 404, body: { error: 'Loan not found' } };
  }

  // Invoice funding
  if (pathname.includes('/api/invoices/') && pathname.endsWith('/fund') && method === 'POST') {
    return {
      status: 200,
      body: { status: 'FUNDED', txHash: '0xmockfundtxhash' },
    };
  }

  return null;
}
