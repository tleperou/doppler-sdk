/**
 * Converts a 32-byte padded hex string to a standard 20-byte Ethereum address
 * @param paddedAddress - The 32-byte padded hex string (66 characters including '0x')
 * @returns A standard 20-byte Ethereum address (42 characters including '0x')
 */
export function trimPaddedAddress(paddedAddress: string): string {
  // Check if the address is padded (32 bytes = 66 characters with '0x')
  if (paddedAddress.length === 66) {
    // Remove '0x' prefix, take last 40 characters (20 bytes), add '0x' prefix back
    return "0x" + paddedAddress.slice(-40);
  }
  // If address is already 20 bytes, return as is
  return paddedAddress;
}
