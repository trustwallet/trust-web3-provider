import { EthereumProvider } from '@trustwallet/web3-provider-ethereum';
import { SolanaProvider } from '@trustwallet/web3-provider-solana';
import { Web3Provider } from '@trustwallet/web3-provider-core';
import { AptosProvider } from '@trustwallet/web3-provider-aptos';
import { TonProvider } from '@trustwallet/web3-provider-ton';
import { ISolanaProviderConfig } from '@trustwallet/web3-provider-solana/types/SolanaProvider';
import { IEthereumProviderConfig } from '@trustwallet/web3-provider-ethereum/types/EthereumProvider';
import { IAptosProviderConfig } from '@trustwallet/web3-provider-aptos/types/AptosProvider';
import { ITonProviderConfig } from '@trustwallet/web3-provider-ton/types/TonProvider';

export interface IWalletConfig {
  ethereum: IEthereumProviderConfig;
  solana: ISolanaProviderConfig;
  aptos: IAptosProviderConfig;
  ton: ITonProviderConfig;
}

window.trustwallet = {};

function setConfig(config: IWalletConfig) {

  const strategy = 'CALLBACK';

  try {
    const core = new Web3Provider({
      strategy,
      handler: (params) => {
        // Disabled methods
        if (params.name === 'wallet_requestPermissions') {
          core.sendResponse(params.id ?? 0, null);
          return;
        }
        if (/(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent)) {
          window.webkit.messageHandlers._tw_.postMessage(params);
        } else {
          window._tw_.postMessage(JSON.stringify(params));
        }
      }
    });

    // Generate instances
    const ethereum = new EthereumProvider(config.ethereum);
    const solana = new SolanaProvider(config.solana);
    const aptos = new AptosProvider(config.aptos);
    const ton = new TonProvider(config.ton);
    ethereum.providers = [ethereum];

    core.registerProviders([ethereum, solana, aptos, ton].map(provider => {
      provider.sendResponse = core.sendResponse.bind(core);
      provider.sendError = core.sendError.bind(core);
      return provider;
    }));

    // Attach to window
    window.ethereum = ethereum;
    
    window.phantom = {
      solana: solana
    }
    window.solana = solana
    window.aptos = aptos
    window.ton = ton

    window.trustwallet = {
      ethereum: ethereum,
      solana: solana,
      aptos: aptos,
      ton: ton,
      onto: ethereum
    }
    window.onto = {
      ethereum: ethereum,
      solana: solana,
      aptos: aptos,
      ton: ton,
    }

    Object.assign(window.trustwallet, {
      isOnto: true,
      request: ethereum.request.bind(ethereum),
      send: ethereum.send.bind(ethereum),
      on: (...params: any) => window.trustwallet.ethereum.on(...params),
      off: (...params: any) => window.trustwallet.ethereum.off(...params),
    });

    const EIP6963Icon =
      'data:image/png;base64,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';
  
    const info = {
      uuid: crypto.randomUUID(),
      name: 'ONTO Wallet',
      icon: EIP6963Icon,
      rdns: 'app.onto',
    };

    const announceEvent = new CustomEvent('eip6963:announceProvider', {
      detail: Object.freeze({ info, provider: ethereum }),
    });

    window.dispatchEvent(announceEvent);

    window.addEventListener('eip6963:requestProvider', () => {
      window.dispatchEvent(announceEvent);
    });
  } catch (e) {
    console.error(e)
  }
}

window.setConfig = setConfig