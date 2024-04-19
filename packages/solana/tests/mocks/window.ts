import { TrustWallet } from '../../adapter/wallet';
export let provider = null;

export const window = {
  wallet: null,

  dispatchEvent: (event: Event) => {
    const $this = window;

    // Mock wallet standard registration system to window object
    if (event.type === 'wallet-standard:register-wallet') {
      (event as any).detail({
        register: (wallet: TrustWallet) => {
          $this.wallet = wallet;
        },
      });
    }

    return true;
  },

  addEventListener: () => {},
} as unknown as Window & typeof globalThis & { wallet: TrustWallet };
