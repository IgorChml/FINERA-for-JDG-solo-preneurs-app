export type KSeFEnvironment = 'DEMO' | 'PRODUCTION';
export type KSeFTokenStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'INVALID';
export type KSeFSyncStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface KSeFToken {
  id: string;
  userId: string;
  token: string;
  environment: KSeFEnvironment;
  status: KSeFTokenStatus;
  lastSyncAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface KSeFInvoiceRaw {
  ksefReferenceNumber: string;
  invoiceHash: {
    hashSHA: {
      algorithm: string;
      encoding: string;
      value: string;
    };
    fileSize: number;
  };
  invoiceHeader: {
    invoiceReferenceNumber: string;
    invoiceType: string;
    issueDateUtc: string;
    acquisitionTimestampUtc: string;
    subjectBy: {
      issuedToIdentifier: {
        type: string;
        identifier: string;
      };
      issuedToName: {
        type: string;
        tradeName: string;
        fullName: string;
      };
    };
    subjectTo: {
      issuedToIdentifier: {
        type: string;
        identifier: string;
      };
      issuedToName: {
        type: string;
        tradeName: string;
        fullName: string;
      };
    };
    invoiceBody: {
      grossValue: string;
      currency: string;
    };
  };
}

export interface KSeFSyncJob {
  id: string;
  userId: string;
  status: KSeFSyncStatus;
  environment: KSeFEnvironment;
  invoicesFetched: number;
  invoicesNew: number;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
}
