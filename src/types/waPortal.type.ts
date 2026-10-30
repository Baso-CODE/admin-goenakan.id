/**
 * TypeScript Interfaces for WhatsApp Portal & Catha WhatsApp Middleware API
 * Corresponds to wa-api.goenakan.tech OpenAPI specifications.
 */

export type WaSessionStatus =
  | "STOPPED"
  | "STARTING"
  | "SCAN_QR_CODE"
  | "WORKING"
  | "FAILED"
  | (string & {});

export interface WaSessionMe {
  id?: string;
  pushName?: string;
}

export interface WaSession {
  id: string;
  name: string;
  status: WaSessionStatus;
  phoneNumber?: string | null;
  me?: WaSessionMe | null;
  createdAt?: string;
  updatedAt?: string;
}

export type WaMessageStatus =
  | "PENDING"
  | "PROCESSING"
  | "SENT"
  | "FAILED"
  | "CANCELLED"
  | (string & {});

export interface WaTrial {
  id: string;
  messageId?: string;
  attempt: number;
  status: string;
  httpStatus?: number | null;
  durationMs?: number | null;
  requestPayload?: any;
  responsePayload?: any;
  errorTrace?: string | null;
  createdAt: string;
}

export interface WaMessage {
  id: string;
  sessionId?: string | null;
  to: string;
  text: string;
  mediaUrl?: string | null;
  status: WaMessageStatus;
  sendAt?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt?: string;
  trials?: WaTrial[];
}

export interface WaWebhookSubscription {
  id: string;
  url: string;
  events: string[];
  isActive?: boolean;
  createdAt?: string;
}

export interface WaHealthResponse {
  status: string;
  timestamp?: string;
  uptime?: number;
  version?: string;
}

export interface SendMessagePayload {
  to: string;
  text: string;
  sessionId?: string;
  mediaUrl?: string;
}

export interface ScheduleMessagePayload {
  to: string;
  text: string;
  sendAt: string;
  sessionId?: string;
  mediaUrl?: string;
}

export interface CreateSessionPayload {
  name: string;
}

export interface CreateWebhookPayload {
  url: string;
  events: string[];
}

export interface WaPipelineStage {
  id: string;
  sessionId: string;
  name: string;
  color: string;
  orderIndex: number;
  isWon: boolean;
  isLost: boolean;
  leadCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WaLabel {
  id: string;
  sessionId: string;
  name: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WaPipelineLead {
  id: string;
  phoneNumber: string;
  name: string;
  pushName?: string | null;
  pictureUrl?: string | null;
  stageId?: string | null;
  labels: WaLabel[];
  lastMessage?: string;
  lastMessageTimestamp?: number;
  updatedAt?: string;
}

export interface WaPipelineBoardStage extends WaPipelineStage {
  leads: WaPipelineLead[];
}

export interface WaChatRoom {
  id: string;
  name: string;
  phoneNumber?: string;
  picture?: string | null;
  isGroup: boolean;
  unreadCount: number;
  timestamp: number;
  stage?: {
    id: string;
    name: string;
    color: string;
  } | null;
  labels?: WaLabel[];
  lastMessage?: {
    id: string;
    body: string;
    timestamp: number;
    fromMe: boolean;
    hasMedia: boolean;
    ack?: number;
  } | null;
}

export interface WaChatMessage {
  id: string;
  body: string;
  timestamp: number;
  from: string;
  to: string;
  fromMe: boolean;
  hasMedia: boolean;
  media?: {
    url?: string;
    mimetype?: string;
    filename?: string;
  } | null;
  ack?: number;
  ackName?: string;
}
