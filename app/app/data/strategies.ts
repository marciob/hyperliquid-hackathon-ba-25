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
  assets: string; // e.g., "UBTC collateral · USDXL debt"
};

export const strategies: Strategy[] = [
  {
    id: "ubtc-usdxl-core",
    name: "LoopGuard – UBTC / USDXL",
    variant: "Core",
    riskLevel: "Moderate",
    estLeverage: 2.4,
    hfTarget: 1.9,
    hfBandMin: 1.6,
    hfBandMax: 2.0,
    shortDescription:
      "Loops UBTC exposure with automatic guard rails to keep HF within safe bands.",
    assets: "UBTC collateral · USDXL debt",
  },
  {
    id: "ubtc-usdxl-conservative",
    name: "LoopGuard – UBTC / USDXL",
    variant: "Conservative",
    riskLevel: "Low",
    estLeverage: 1.8,
    hfTarget: 2.0,
    hfBandMin: 1.7,
    hfBandMax: 2.2,
    shortDescription:
      "Lower risk variant with wider cushions and reduced rebalancing intensity.",
    assets: "UBTC collateral · USDXL debt",
  },
  {
    id: "ubtc-usdxl-experimental",
    name: "LoopGuard – UBTC / USDXL",
    variant: "Experimental",
    riskLevel: "High",
    estLeverage: 3.0,
    hfTarget: 1.8,
    hfBandMin: 1.5,
    hfBandMax: 2.0,
    shortDescription:
      "Higher leverage profile. More responsive to market odds for proactive rebalancing.",
    assets: "UBTC collateral · USDXL debt",
  },
];


