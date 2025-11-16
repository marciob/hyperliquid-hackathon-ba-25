// Contract addresses (HyperEVM 999). Read from env when provided.
const HYPE = (process.env.NEXT_PUBLIC_HYPE_ADDRESS as `0x${string}` | undefined) ?? "0x0000000000000000000000000000000000000000";
const USDXL =
  (process.env.NEXT_PUBLIC_USDXL_ADDRESS as `0x${string}` | undefined) ?? "0x0000000000000000000000000000000000000000";
const LOOP_GUARD_VAULT =
  (process.env.NEXT_PUBLIC_LOOP_GUARD_VAULT_ADDRESS as `0x${string}` | undefined) ??
  "0x0000000000000000000000000000000000000000";

export const ADDRESSES = {
  HYPE,
  USDXL,
  LOOP_GUARD_VAULT,
} as const;

export type AddressBook = typeof ADDRESSES;
