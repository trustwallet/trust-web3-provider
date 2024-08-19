import { registerWallet } from './register';
import { ONTOWallet } from './wallet';
import type { ONTO } from './window';

export function initialize(ONTO: ONTO): void {
    registerWallet(new ONTOWallet(ONTO));
}
