// Domain Type Definitions
// Following the pseudocode from Phase 2.1 - Core Type Definitions Creation Algorithm

export namespace Domain {
  export interface ApiKey {
    readonly value: string;
    readonly isValid: boolean;
    readonly validatedAt: Date | null;
    readonly source: 'user' | 'environment';
  }

  export interface PromptTemplate {
    readonly id: string;
    readonly name: string;
    readonly prompt: string;
    readonly category: string;
    readonly variables: readonly string[];
    readonly metadata: TemplateMetadata;
  }

  export interface TemplateMetadata {
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly version: number;
    readonly author: string;
    readonly tags: readonly string[];
  }

  export interface ExecutionConfig {
    readonly maxOutputTokens: number;
    readonly temperature: number;
    readonly topP: number;
    readonly topK?: number;
    readonly stopSequences?: readonly string[];
  }

  export interface ExecutionResult {
    readonly success: boolean;
    readonly content?: string;
    readonly error?: ExecutionError;
    readonly metadata: ExecutionMetadata;
  }

  export interface ExecutionMetadata {
    readonly requestId: string;
    readonly timestamp: Date;
    readonly duration: number;
    readonly tokenUsage: TokenUsage;
  }

  export interface TokenUsage {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  }

  export interface ExecutionError {
    readonly code: ErrorCode;
    readonly message: string;
    readonly details?: unknown;
  }

  export enum ErrorCode {
    INVALID_API_KEY = 'INVALID_API_KEY',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
    CONTENT_FILTERED = 'CONTENT_FILTERED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  }

  export interface UserSettings {
    readonly maxOutputTokens: number;
    readonly blockedDomains: readonly string[];
    readonly promptTemplates: readonly PromptTemplate[];
    readonly autoSummarize: boolean;
  }

  export interface GenerationConfig {
    readonly maxOutputTokens: number;
    readonly temperature: number;
    readonly topP: number;
    readonly topK?: number;
    readonly stopSequences?: readonly string[];
  }

  export interface GeminiResponse {
    readonly text: string;
    readonly metadata: ResponseMetadata;
  }

  export interface ResponseMetadata {
    readonly finishReason: string;
    readonly safetyRatings: SafetyRating[];
    readonly tokenUsage: TokenUsage;
  }

  export interface SafetyRating {
    readonly category: string;
    readonly probability: string;
  }

  export interface ContentAnalysis {
    readonly textLength: number;
    readonly language: string;
    readonly contentType: ContentType;
    readonly extractedElements: ExtractedElement[];
  }

  export enum ContentType {
    ARTICLE = 'ARTICLE',
    SOCIAL_MEDIA = 'SOCIAL_MEDIA',
    EMAIL = 'EMAIL',
    DOCUMENT = 'DOCUMENT',
    WEB_PAGE = 'WEB_PAGE',
    UNKNOWN = 'UNKNOWN',
  }

  export interface ExtractedElement {
    readonly type: ElementType;
    readonly content: string;
    readonly position: number;
  }

  export enum ElementType {
    HEADING = 'HEADING',
    PARAGRAPH = 'PARAGRAPH',
    LIST = 'LIST',
    CODE = 'CODE',
    QUOTE = 'QUOTE',
    LINK = 'LINK',
  }

  export interface DomainBlockingRule {
    readonly domain: string;
    readonly isBlocked: boolean;
    readonly reason?: string;
    readonly addedAt: Date;
  }
}
