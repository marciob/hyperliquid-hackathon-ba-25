export type RiskLevel = "Low" | "Moderate" | "High";

export type Strategy = {
  id: string;
  name: string;
  variant?: string;
  riskLevel: RiskLevel;
  estLeverage: number;
  hfTarget: number;
  hfBandMin: number;
  hfBandMax: number;
  shortDescription: string;
  assets: string; // e.g., "HYPE collateral · USDXL debt"
};

export const strategies: Strategy[] = [
  {
    id: "hype-usdxl-core",
    name: "LoopGuard – HYPE / USDXL",
    variant: "Core",
    riskLevel: "Moderate",
    estLeverage: 2.4,
    hfTarget: 1.9,
    hfBandMin: 1.6,
    hfBandMax: 2.0,
    shortDescription:
      "Loops HYPE exposure with automatic guard rails to keep HF within safe bands.",
    assets: "HYPE collateral · USDXL debt",
  },
  {
    id: "hype-usdxl-conservative",
    name: "LoopGuard – HYPE / USDXL",
    variant: "Conservative",
    riskLevel: "Low",
    estLeverage: 1.8,
    hfTarget: 2.0,
    hfBandMin: 1.7,
    hfBandMax: 2.2,
    shortDescription:
      "Lower risk variant with wider cushions and reduced rebalancing intensity.",
    assets: "HYPE collateral · USDXL debt",
  },
  {
    id: "hype-usdxl-experimental",
    name: "LoopGuard – HYPE / USDXL",
    variant: "Experimental",
    riskLevel: "High",
    estLeverage: 3.0,
    hfTarget: 1.8,
    hfBandMin: 1.5,
    hfBandMax: 2.0,
    shortDescription:
      "Higher leverage profile. More responsive to market odds for proactive rebalancing.",
    assets: "HYPE collateral · USDXL debt",
  },
];
