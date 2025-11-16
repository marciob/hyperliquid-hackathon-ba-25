/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect } from "chai";
import hre, { network } from "hardhat";

/**
 * Initial Hardhat test skeletons that use a HyperEVM mainnet fork.
 *
 * Requirements (set via env when running tests):
 * - HYPEREVM_RPC_URL: HyperEVM mainnet RPC URL (chainId 999)
 * - HYPE_ADDRESS: collateral token address (HYPE, 18 decimals)
 * - USDXL_ADDRESS: debt token address (USDXL, 18 decimals)
 * - HYPU_POOL_ADDRESS: HypurrFi Pool address
 * - ROUTER_ADDRESS: Optional swap router (set to 0x000...000 to disable swaps)
 * - HYPE_WHALE: an address with HYPE balance to impersonate for funding test account
 *
 * Usage:
 *   HYPEREVM_RPC_URL=... HYPE_ADDRESS=... USDXL_ADDRESS=... HYPU_POOL_ADDRESS=... ROUTER_ADDRESS=... HYPE_WHALE=... npx hardhat test test/vault.fork.spec.ts
 *
 * Notes:
 * - These are minimal skeleton tests intended to be expanded with concrete assertions.
 * - We keep borrowing small and guarded. Adjust amounts conservatively.
 */

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const FORK_TX = process.env.FORK_TX === "1";
const env = {
  RPC_URL: process.env.HYPEREVM_RPC_URL || "https://rpc.hyperliquid.xyz/evm",
  HYPE: process.env.HYPE_ADDRESS,
  USDXL: process.env.USDXL_ADDRESS,
  POOL: process.env.HYPU_POOL_ADDRESS,
  ROUTER: process.env.ROUTER_ADDRESS || ZERO_ADDRESS,
  HYPE_WHALE: process.env.HYPE_WHALE,
};

async function getEthers() {
  const { ethers } = (await network.connect()) as any;
  return ethers;
}

async function getFeeOpts() {
  const ethers = await getEthers();
  const block = await ethers.provider.getBlock("latest");
  const base: bigint =
    (block?.baseFeePerGas as bigint) ?? ethers.parseUnits("1", "gwei");
  const priority: bigint = ethers.parseUnits("2", "gwei");
  return {
    maxPriorityFeePerGas: priority,
    maxFeePerGas: base * 2n + priority,
  };
}

async function resolvePoolAddress(): Promise<string> {
  if (env.POOL && env.POOL !== ZERO_ADDRESS) return env.POOL;
  const providerAddress =
    process.env.HYPU_ADDRESSES_PROVIDER ||
    "0xA73ff12D177D8F1Ec938c3ba0e87D33524dD5594"; // from docs
  const providerAbi = ["function getPool() view returns (address)"];
  const ethers = await getEthers();
  const provider = await ethers.getContractAt(providerAbi, providerAddress);
  const pool = (await provider.getPool()) as string;
  return pool;
}

async function resetFork(blockNumber?: number) {
  const { ethers } = (await network.connect()) as any;
  await ethers.provider.send("hardhat_reset", [
    {
      forking: {
        jsonRpcUrl: env.RPC_URL,
        ...(blockNumber ? { blockNumber } : {}),
      },
    },
  ]);
}

let snapshotId: string | null = null;
async function takeSnapshot() {
  const { ethers } = (await network.connect()) as any;
  snapshotId = await ethers.provider.send("evm_snapshot", []);
}
async function revertSnapshot() {
  if (!snapshotId) return;
  const { ethers } = (await network.connect()) as any;
  await ethers.provider.send("evm_revert", [snapshotId]);
  snapshotId = null;
}

async function impersonate(address: string) {
  const { ethers } = (await network.connect()) as any;
  await ethers.provider.send("hardhat_impersonateAccount", [address]);
  const signer = await ethers.getSigner(address);
  return signer;
}

async function stopImpersonate(address: string) {
  const { ethers } = (await network.connect()) as any;
  await ethers.provider.send("hardhat_stopImpersonatingAccount", [address]);
}

async function fundWithEth(address: string, etherAmount = "50") {
  const { ethers } = (await network.connect()) as any;
  const weiHex = ethers.toBeHex(ethers.parseEther(etherAmount));
  await ethers.provider.send("hardhat_setBalance", [address, weiHex]);
}

async function wrapWhypeTo(
  recipient: string,
  amountWei: bigint,
  signerAddress: string
) {
  const { ethers } = (await network.connect()) as any;
  const signer = await ethers.getSigner(signerAddress);
  // WHYPE deposit() payable mints WHYPE 1:1 for native HYPE
  const whype = new ethers.Contract(
    env.HYPE,
    ["function deposit() payable"],
    signer
  );
  await (await whype.deposit({ value: amountWei })).wait();
}

describe("LoopGuardVault (HyperEVM fork) – skeleton", function () {
  // Increase timeout for fork operations
  this.timeout(120_000);

  beforeEach(async function () {
    if (!env.HYPE || !env.USDXL) {
      return this.skip();
    }
    try {
      await resetFork();
    } catch {
      // Fallback for providers that don't support hardhat_reset:
      try {
        if (snapshotId) {
          await revertSnapshot();
        }
        await takeSnapshot();
      } catch {
        return this.skip();
      }
    }
  });

  it("deploys a vault and reads initial status", async function () {
    if (!env.HYPE || !env.USDXL) {
      return this.skip();
    }

    const { ethers } = (await network.connect()) as any;
    const [deployer] = await ethers.getSigners();
    const Vault = await ethers.getContractFactory("LoopGuardVault", deployer);
    const poolAddress = await resolvePoolAddress();
    const fee = await getFeeOpts();

    const hfTarget = ethers.parseUnits("1.90", 18);
    const hfSoft = ethers.parseUnits("1.60", 18);
    const hfHard = ethers.parseUnits("1.40", 18);

    const vault = await Vault.deploy(
      env.HYPE,
      env.USDXL,
      poolAddress,
      env.ROUTER,
      hfTarget,
      hfSoft,
      hfHard,
      fee
    );
    await vault.waitForDeployment();

    const status = await vault.getVaultStatus();
    // status: [totalShares, totalCollateralBase, totalDebtBase, availableBorrowsBase, healthFactor]
    expect(status[0]).to.equal(0n);
  });

  it("depositAndLoop with small HYPE amount (requires HYPE_WHALE funding)", async function () {
    if (!env.HYPE || !env.USDXL || !env.HYPE_WHALE) {
      return this.skip();
    }
    const { ethers } = (await network.connect()) as any;
    const [user] = await ethers.getSigners();
    const hype = await ethers.getContractAt("IERC20", env.HYPE, user);
    const poolAddress = await resolvePoolAddress();
    const pool = await ethers.getContractAt("IHypurrFiPool", poolAddress, user);
    const fee = await getFeeOpts();

    const Vault = await ethers.getContractFactory("LoopGuardVault", user);
    const hfTarget = ethers.parseUnits("1.90", 18);
    const hfSoft = ethers.parseUnits("1.60", 18);
    const hfHard = ethers.parseUnits("1.40", 18);
    const vault = await Vault.deploy(
      env.HYPE,
      env.USDXL!,
      poolAddress,
      env.ROUTER,
      hfTarget,
      hfSoft,
      hfHard,
      fee
    );
    await vault.waitForDeployment();

    // Fund user with small HYPE from whale
    const whaleAddr = env.HYPE_WHALE!;
    const whale = await impersonate(whaleAddr);
    await fundWithEth(whaleAddr, "50"); // ensure gas for the impersonated whale
    const hypeFromWhale = await ethers.getContractAt("IERC20", env.HYPE, whale);

    const fundAmount = ethers.parseUnits("1", 18); // 1 HYPE
    // Ensure whale has WHYPE by wrapping native HYPE
    await wrapWhypeTo(whaleAddr, fundAmount, whaleAddr);
    await (
      await hypeFromWhale.transfer(
        await user.getAddress(),
        fundAmount,
        await getFeeOpts()
      )
    ).wait();
    await stopImpersonate(whaleAddr);

    // Approve vault and deposit
    await (
      await hype.approve(
        await vault.getAddress(),
        fundAmount,
        await getFeeOpts()
      )
    ).wait();
    if (!FORK_TX) {
      await vault.depositAndLoop.staticCall(fundAmount);
      return;
    } else {
      const tx = await vault.depositAndLoop(fundAmount, await getFeeOpts());
      await tx.wait();
    }

    const statusAfter = await vault.getVaultStatus();
    // Basic sanity: shares minted and some collateral base registered
    expect(statusAfter[0]).to.be.greaterThan(0n);
    expect(statusAfter[1]).to.be.greaterThan(0n);
  });

  it("rebalance deleverages when HF < hfSoftFloor (skeleton)", async function () {
    if (!env.HYPE || !env.USDXL || !env.HYPE_WHALE) {
      return this.skip();
    }
    const { ethers } = (await network.connect()) as any;
    const [user] = await ethers.getSigners();
    const hype = await ethers.getContractAt("IERC20", env.HYPE, user);
    const usdxl = await ethers.getContractAt("IERC20", env.USDXL!, user);
    const poolAddress = await resolvePoolAddress();
    const pool = await ethers.getContractAt("IHypurrFiPool", poolAddress, user);
    const fee = await getFeeOpts();

    const Vault = await ethers.getContractFactory("LoopGuardVault", user);
    const hfTarget = ethers.parseUnits("1.90", 18);
    const hfSoft = ethers.parseUnits("1.60", 18);
    const hfHard = ethers.parseUnits("1.40", 18);
    const vault = await Vault.deploy(
      env.HYPE,
      env.USDXL!,
      poolAddress,
      env.ROUTER,
      hfTarget,
      hfSoft,
      hfHard,
      fee
    );
    await vault.waitForDeployment();

    // Fund + deposit small amount
    const whaleAddr = env.HYPE_WHALE!;
    const whale = await impersonate(whaleAddr);
    await fundWithEth(whaleAddr, "50");
    const hypeFromWhale = await ethers.getContractAt("IERC20", env.HYPE, whale);
    const fundAmount = ethers.parseUnits("2", 18); // 2 HYPE
    await wrapWhypeTo(whaleAddr, fundAmount, whaleAddr);
    await (
      await hypeFromWhale.transfer(
        await user.getAddress(),
        fundAmount,
        await getFeeOpts()
      )
    ).wait();
    await stopImpersonate(whaleAddr);
    await (
      await hype.approve(
        await vault.getAddress(),
        fundAmount,
        await getFeeOpts()
      )
    ).wait();
    if (!FORK_TX) {
      await vault.depositAndLoop.staticCall(fundAmount);
      return;
    } else {
      await (await vault.depositAndLoop(fundAmount, await getFeeOpts())).wait();
    }

    // Artificially stress the position: borrow more USDXL on behalf of the vault
    const [, , , , , hfBefore] = await pool.getUserAccountData(
      await vault.getAddress()
    );
    // Borrow a tiny bit to move HF down; adjust cautiously
    const extraBorrow = ethers.parseUnits("0.5", 18);
    await pool.borrow(
      env.USDXL!,
      extraBorrow,
      2,
      0,
      await vault.getAddress(),
      await getFeeOpts()
    );

    const [, , , , , hfPreRebalance] = await pool.getUserAccountData(
      await vault.getAddress()
    );
    expect(hfPreRebalance).to.be.lessThan(hfBefore);

    // Rebalance (deleverage-only)
    if (!FORK_TX) {
      await vault.rebalance.staticCall();
      return;
    } else {
      await (await vault.rebalance(await getFeeOpts())).wait();
    }

    const [, , , , , hfAfter] = await pool.getUserAccountData(
      await vault.getAddress()
    );
    expect(hfAfter).to.be.greaterThanOrEqual(hfPreRebalance);
  });

  it("withdraw burns shares and returns HYPE (skeleton)", async function () {
    if (!env.HYPE || !env.USDXL || !env.HYPE_WHALE) {
      return this.skip();
    }
    const { ethers } = (await network.connect()) as any;
    const [user] = await ethers.getSigners();
    const hype = await ethers.getContractAt("IERC20", env.HYPE, user);
    const poolAddress = await resolvePoolAddress();
    const pool = await ethers.getContractAt("IHypurrFiPool", poolAddress, user);
    const fee = await getFeeOpts();

    const Vault = await ethers.getContractFactory("LoopGuardVault", user);
    const hfTarget = ethers.parseUnits("1.90", 18);
    const hfSoft = ethers.parseUnits("1.60", 18);
    const hfHard = ethers.parseUnits("1.40", 18);
    const vault = await Vault.deploy(
      env.HYPE,
      env.USDXL!,
      poolAddress,
      env.ROUTER,
      hfTarget,
      hfSoft,
      hfHard,
      fee
    );
    await vault.waitForDeployment();

    // Fund + deposit
    const whaleAddr = env.HYPE_WHALE!;
    const whale = await impersonate(whaleAddr);
    await fundWithEth(whaleAddr, "50");
    const hypeFromWhale = await ethers.getContractAt("IERC20", env.HYPE, whale);
    const fundAmount = ethers.parseUnits("1.5", 18);
    await wrapWhypeTo(whaleAddr, fundAmount, whaleAddr);
    await (
      await hypeFromWhale.transfer(
        await user.getAddress(),
        fundAmount,
        await getFeeOpts()
      )
    ).wait();
    await stopImpersonate(whaleAddr);
    await (
      await hype.approve(
        await vault.getAddress(),
        fundAmount,
        await getFeeOpts()
      )
    ).wait();
    if (!FORK_TX) {
      await vault.depositAndLoop.staticCall(fundAmount);
      return;
    } else {
      await (await vault.depositAndLoop(fundAmount, await getFeeOpts())).wait();
    }

    const totalShares = await vault.totalShares();
    const half = totalShares / 2n;
    const hypeBefore = await hype.balanceOf(await user.getAddress());

    await (await vault.withdraw(half, await getFeeOpts())).wait();

    const hypeAfter = await hype.balanceOf(await user.getAddress());
    expect(hypeAfter).to.be.greaterThan(hypeBefore);
  });
});
