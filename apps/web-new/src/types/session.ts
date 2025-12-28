import type { Template } from "./template";

export interface SessionListItem {
  id: string;
  name: string;
  template_id: string;
  created_at: string;
  has_a: boolean;
  has_b: boolean;
}

export interface SessionInfo extends SessionListItem {
  template: Template;
  updated_at: string;
}

export interface CreateSessionRequest {
  name: string;
  template_id: string;
}
