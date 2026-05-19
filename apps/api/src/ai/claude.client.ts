import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config.js';

type MessageParams = Anthropic.MessageCreateParamsNonStreaming;
type Message = Anthropic.Message;

interface CallResult {
  message: Message;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
}

// Circuit breaker state — prevents cascading failures
const circuitBreaker = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
  THRESHOLD: 5,
  TIMEOUT_MS: 60_000,

  recordSuccess() {
    this.failures = 0;
    this.isOpen = false;
  },

  recordFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.THRESHOLD) {
      this.isOpen = true;
    }
  },

  canCall(): boolean {
    if (!this.isOpen) return true;
    // Auto-reset after timeout
    if (Date.now() - this.lastFailure > this.TIMEOUT_MS) {
      this.isOpen = false;
      this.failures = 0;
      return true;
    }
    return false;
  },
};

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export async function callClaude(
  params: MessageParams,
  retries = 2
): Promise<CallResult> {
  if (!circuitBreaker.canCall()) {
    throw Object.assign(new Error('Claude API circuit breaker open — service degraded'), {
      code: 'CIRCUIT_OPEN',
    });
  }

  const start = Date.now();
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const message = await getClient().messages.create(params);
      const latencyMs = Date.now() - start;

      circuitBreaker.recordSuccess();

      return {
        message,
        latencyMs,
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      };
    } catch (err) {
      lastError = err;

      // Don't retry on auth errors or invalid requests
      const status = (err as { status?: number }).status;
      if (status === 401 || status === 400) break;

      // Exponential backoff between retries
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
  }

  circuitBreaker.recordFailure();
  throw lastError;
}

export function extractText(message: Message): string {
  const block = message.content[0];
  return block?.type === 'text' ? block.text : '';
}

export function parseJsonFromClaude<T>(text: string, fallback: T): T {
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to find JSON object within the text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        /* fall through */
      }
    }
    return fallback;
  }
}

export { circuitBreaker };
