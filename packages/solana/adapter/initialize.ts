import ISolanaProvider from '../types/SolanaProvider';
import { registerWallet } from './register';

function initialize(trust: ISolanaProvider): void {
  registerWallet(trust.getInstanceWithAdapter());
}

export default initialize;
