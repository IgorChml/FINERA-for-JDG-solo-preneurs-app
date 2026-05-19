import type { FastifyInstance } from 'fastify';
import { callClaude, extractText, parseJsonFromClaude } from '../ai/claude.client.js';
import { OCR_EXTRACTION_SYSTEM, OCR_EXTRACTION_USER } from '../ai/prompts/ocr-extraction.prompt.js';
import {
  OCR_RISK_AUDIT_SYSTEM,
  OCR_RISK_AUDIT_USER_TEMPLATE,
} from '../ai/prompts/ocr-risk-audit.prompt.js';
import {
  OcrExtractionSchema,
  RiskAuditSchema,
  type OcrExtraction,
  type RiskAudit,
} from '@finera/shared';

const OCR_FALLBACK: OcrExtraction = {
  date: null,
  amount: null,
  amountGross: null,
  vatAmount: null,
  vendorName: null,
  vendorNip: null,
  category: null,
  documentType: 'OTHER',
  confidence: 0,
};

const RISK_FALLBACK: RiskAudit = {
  level: 'YELLOW',
  message:
    'Nie udało się ocenić ryzyka automatycznie. Skonsultuj z księgowym przed ujęciem w kosztach.',
  recommendation: 'Sprawdź ręcznie kategorię wydatku i zachowaj dokumentację celu biznesowego.',
  legalBasis: null,
  safeDeductionPct: null,
};

export class OcrService {
  constructor(private readonly fastify: FastifyInstance) {}

  async extractFromImage(
    base64Image: string,
    mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
  ): Promise<{ extraction: OcrExtraction; inputTokens: number; outputTokens: number; latencyMs: number }> {
    const start = Date.now();

    try {
      const result = await callClaude({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: OCR_EXTRACTION_SYSTEM,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64Image },
              },
              { type: 'text', text: OCR_EXTRACTION_USER },
            ],
          },
        ],
      });

      const raw = parseJsonFromClaude<unknown>(extractText(result.message), {});
      const parsed = OcrExtractionSchema.safeParse(raw);

      if (!parsed.success) {
        this.fastify.log.warn({ issues: parsed.error.issues }, 'OCR schema validation failed');
        return {
          extraction: { ...OCR_FALLBACK, confidence: 0.1 },
          ...result,
          latencyMs: Date.now() - start,
        };
      }

      return { extraction: parsed.data, ...result, latencyMs: Date.now() - start };
    } catch (err) {
      this.fastify.log.error({ err }, 'OCR extraction failed — using fallback');
      return {
        extraction: OCR_FALLBACK,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - start,
      };
    }
  }

  async assessTaxRisk(
    extraction: OcrExtraction,
    userTaxForm: string,
    confirmedCategory: string
  ): Promise<{ audit: RiskAudit; inputTokens: number; outputTokens: number; latencyMs: number }> {
    const start = Date.now();

    try {
      const result = await callClaude({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: OCR_RISK_AUDIT_SYSTEM,
        messages: [
          {
            role: 'user',
            content: OCR_RISK_AUDIT_USER_TEMPLATE(
              confirmedCategory,
              userTaxForm,
              extraction.amountGross ?? extraction.amount ?? 0,
              extraction.vendorName ?? 'Nieznany'
            ),
          },
        ],
      });

      const raw = parseJsonFromClaude<unknown>(extractText(result.message), {});
      const parsed = RiskAuditSchema.safeParse(raw);

      if (!parsed.success) {
        return { audit: RISK_FALLBACK, ...result, latencyMs: Date.now() - start };
      }

      // Enforce mandatory disclaimer in message
      let audit = parsed.data;
      if (!audit.message.includes('Skonsultuj z księgowym')) {
        audit = {
          ...audit,
          message: audit.message + ' Skonsultuj z księgowym przed ujęciem w kosztach.',
        };
      }

      return { audit, ...result, latencyMs: Date.now() - start };
    } catch (err) {
      this.fastify.log.error({ err }, 'Risk audit failed — using fallback');
      return {
        audit: RISK_FALLBACK,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - start,
      };
    }
  }

  async logAiCall(
    userId: string | null,
    module: 'OCR_EXTRACTION' | 'OCR_RISK_AUDIT' | 'INSIGHT_NARRATIVE',
    tokens: { input: number; output: number },
    latencyMs: number,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    await this.fastify.prisma.aiCallLog
      .create({
        data: {
          userId,
          module,
          inputTokens: tokens.input,
          outputTokens: tokens.output,
          latencyMs,
          success,
          errorMessage,
        },
      })
      .catch((err) => this.fastify.log.warn({ err }, 'Failed to log AI call'));
  }
}
