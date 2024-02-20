import { registerWallet } from './register';
import { TrustWallet } from './wallet';
import type { Trust } from './window';

function initialize(trust: Trust): void {
    registerWallet(new TrustWallet(trust));
}

export default initialize;
