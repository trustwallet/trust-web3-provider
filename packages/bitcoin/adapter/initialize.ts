import { TrustBitcoinWallet } from './wallet';
import { registerWallet } from './register';
import type IBitcoinProvider from '../types/BitcoinProvider';

export function initialize(bitcoin: IBitcoinProvider): void {
  registerWallet(new TrustBitcoinWallet(bitcoin));
}
