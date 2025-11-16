import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LoopGuardVaultModule = buildModule("LoopGuardVaultModule", (m) => {
  // Real HyperEVM addresses (fill these in when you’re ready)
  const collateral = m.getParameter(
    "collateral",
    "0x9fdbda0a5e284c32744d2f17ee5c74b284993463" // UBTC
  );

  const debt = m.getParameter(
    "debt",
    "0xca79db4b49f608ef54a5cb813fbed3a6387bc645" // USDXL
  );

  const pool = m.getParameter(
    "pool",
    "0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b" // HypurrFi Pool
  );

  // TODO: Decide router & ABI integration before mainnet deploy.
  // For now, keep this as a parameter you can override from CLI.
  const router = m.getParameter(
    "router",
    "0x0000000000000000000000000000000000000000"
  );

  // HF params (1e18-scaled)
  const hfTarget = m.getParameter<bigint>(
    "hfTarget",
    1900000000000000000n // 1.9e18
  );
  const hfSoftFloor = m.getParameter<bigint>(
    "hfSoftFloor",
    1600000000000000000n // 1.6e18
  );
  const hfHardFloor = m.getParameter<bigint>(
    "hfHardFloor",
    1400000000000000000n // 1.4e18
  );

  const vault = m.contract("LoopGuardVault", [
    collateral,
    debt,
    pool,
    router,
    hfTarget,
    hfSoftFloor,
    hfHardFloor,
  ]);

  return { vault };
});

export default LoopGuardVaultModule;


