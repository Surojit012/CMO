/* Ambient type declarations for Circle SDK packages.
 * These are optional runtime dependencies (loaded via require() on the client).
 * The stubs satisfy the TypeScript compiler without requiring the packages
 * to be installed in every environment (e.g. Vercel CI). */

declare module "@circle-fin/app-kit" {
  export class AppKit {
    swap(params: any): Promise<any>;
  }
}

declare module "@circle-fin/adapter-viem-v2" {
  export function createViemAdapter(params: { walletClient: any }): any;
}
