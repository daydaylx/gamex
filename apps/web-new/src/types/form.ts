export interface ConsentRatingValue {
  status?: string;
  interest?: number;
  comfort?: number;
  dom_status?: string;
  dom_interest?: number;
  dom_comfort?: number;
  sub_status?: string;
  sub_interest?: number;
  sub_comfort?: number;
  active_status?: string;
  active_interest?: number;
  active_comfort?: number;
  passive_status?: string;
  passive_interest?: number;
  passive_comfort?: number;
}

export interface ScaleValue {
  value: number | null;
}

export interface EnumValue {
  value: string | null;
}

export interface MultiValue {
  values: string[];
}

export interface TextValue {
  text: string;
}

export interface ScenarioValue {
  scenario_id: string;
  status?: string;
  interest?: number;
  comfort?: number;
}

export interface QuestionNotes {
  notes?: string;
  conditions?: string;
}

export type ResponseValue =
  | ConsentRatingValue
  | ScaleValue
  | EnumValue
  | MultiValue
  | TextValue
  | ScenarioValue
  | null;

export type ResponseMap = Record<string, ResponseValue>;

export interface SaveResponsesRequest {
  responses: ResponseMap;
}
