export interface TierUsage {
  name: string;
  percentage: number;
}

export interface UsageResult {
  status: "ok";
  provider: string;
  plan: string;
  tiers: TierUsage[];
  overall_percentage: number;
  reset_date: string | null;
  reset_in_hours: number | null;
}

export interface ErrorResult {
  status: "error";
  error_code: string;
  message: string;
}

export type Result = UsageResult | ErrorResult;

export interface Provider {
  name: string;
  fetchUsage(credential: string): Promise<UsageResult | null>;
}
