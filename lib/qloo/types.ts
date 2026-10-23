export type QlooEntity = {
  entity_id: string;
  name: string;
  subtype?: string;
};

export type QlooSearchResponse = {
  results?: QlooEntity[];
};

export type QlooInsightsEntity = {
  entity_id: string;
  name?: string;
  query?: { affinity?: number };
  affinity?: number;
};

export type QlooInsightsResponse = {
  success?: boolean;
  results?: {
    entities?: QlooInsightsEntity[];
  };
};
