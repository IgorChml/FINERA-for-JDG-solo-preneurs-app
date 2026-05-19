import { env } from '../config.js';
import type { KSeFEnvironment } from '@finera/shared';

interface KSeFSessionResponse {
  sessionToken: {
    token: string;
    context: {
      contextName: { type: string; tradeName: string; fullName: string };
      contextIdentifier: { type: string; identifier: string };
    };
  };
  timestamp: string;
  referenceNumber: string;
}

interface KSeFInvoiceQueryResponse {
  invoiceHeaderList: Array<{
    ksefReferenceNumber: string;
    invoiceHeader: {
      invoiceReferenceNumber: string;
      issueDateUtc: string;
      acquisitionTimestampUtc: string;
      subjectBy: { issuedToIdentifier: { identifier: string }; issuedToName: { fullName: string } };
      subjectTo: { issuedToIdentifier: { identifier: string }; issuedToName: { fullName: string } };
      invoiceBody: { grossValue: string; currency: string };
    };
  }>;
  numberOfElements: number;
  pageSize: number;
  pageOffset: number;
}

export class KSeFAdapter {
  private readonly baseUrl: string;

  constructor(environment: KSeFEnvironment = 'DEMO') {
    this.baseUrl = environment === 'PRODUCTION' ? env.KSEF_PROD_URL : env.KSEF_DEMO_URL;
  }

  async initSession(token: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/online/Session/InitToken`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({
        context: {
          contextName: { type: 'fn', tradeName: 'FINERA' },
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`KSeF session init failed: ${response.status} — ${err}`);
    }

    const data = (await response.json()) as KSeFSessionResponse;
    return data.sessionToken.token;
  }

  async queryInvoices(
    sessionToken: string,
    params: {
      dateFrom: Date;
      dateTo: Date;
      subjectType: 'subject1' | 'subject2' | 'subjectAuthorized';
      pageOffset?: number;
      pageSize?: number;
    }
  ): Promise<KSeFInvoiceQueryResponse> {
    const body = {
      queryCriteria: {
        subjectType: params.subjectType,
        type: 'incremental',
        acquisitionTimestampThresholdFrom: params.dateFrom.toISOString(),
        acquisitionTimestampThresholdTo: params.dateTo.toISOString(),
      },
    };

    const response = await fetch(
      `${this.baseUrl}/online/Query/Invoice/Sync?PageOffset=${params.pageOffset ?? 0}&PageSize=${params.pageSize ?? 100}`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'session-token': sessionToken,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`KSeF invoice query failed: ${response.status} — ${err}`);
    }

    return response.json() as Promise<KSeFInvoiceQueryResponse>;
  }

  async sendInvoice(sessionToken: string, invoiceXml: string): Promise<{ ksefReferenceNumber: string }> {
    const response = await fetch(`${this.baseUrl}/online/Invoice/Send`, {
      method: 'PUT',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'session-token': sessionToken,
      },
      body: JSON.stringify({
        invoiceHash: {
          hashSHA: { algorithm: 'SHA-256', encoding: 'Base64', value: '' },
          fileSize: Buffer.byteLength(invoiceXml, 'utf8'),
        },
        invoicePayload: {
          type: 'plain',
          invoiceBody: Buffer.from(invoiceXml, 'utf8').toString('base64'),
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`KSeF invoice send failed: ${response.status} — ${err}`);
    }

    const data = (await response.json()) as { ksefReferenceNumber: string };
    return data;
  }

  async terminateSession(sessionToken: string): Promise<void> {
    await fetch(`${this.baseUrl}/online/Session/Terminate`, {
      method: 'GET',
      headers: { accept: 'application/json', 'session-token': sessionToken },
    }).catch(() => {});
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const sessionToken = await this.initSession(token);
      await this.terminateSession(sessionToken);
      return true;
    } catch {
      return false;
    }
  }
}
