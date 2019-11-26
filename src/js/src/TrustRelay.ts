import crypto from "crypto"
import { ScopedLocalStorage } from "./ScopedLocalStorage"
import { AddressString, IntNumber, RegExpString } from "./types/common"
import { IPCMessage } from "./types/IPCMessage"
import { Web3Method } from "./types/Web3Method"
import {
  ArbitraryRequest,
  EthereumAddressFromSignedMessageRequest,
  RequestEthereumAccountsRequest,
  ScanQRCodeRequest,
  SignEthereumMessageRequest,
  SignEthereumTransactionRequest,
  SubmitEthereumTransactionRequest,
  Web3Request
} from "./types/Web3Request"
import { Web3RequestMessage } from "./types/Web3RequestMessage"
import {
  ArbitraryResponse,
  EthereumAddressFromSignedMessageResponse, isRequestEthereumAccountsResponse,
  RequestEthereumAccountsResponse,
  ScanQRCodeResponse,
  SignEthereumMessageResponse,
  SignEthereumTransactionResponse,
  SubmitEthereumTransactionResponse,
  Web3Response
} from "./types/Web3Response"
import { bigIntStringFromBN, hexStringFromBuffer } from "./util"
import * as walletLinkBlockedDialog from "./walletLinkBlockedDialog"
import {EthereumTransactionParams} from "./WalletLinkRelay";
import {Web3ResponseMessage} from "./types/Web3ResponseMessage";
import bind from "bind-decorator";

type ResponseCallback = (response: Web3Response) => void

const BLOCKED_LOCAL_STORAGE_ERROR_MESSAGE =
    "Browser is blocking third-party localStorage usage. To continue, " +
    "turn off third-party storage blocking or whitelist WalletLink."

export class TrustRelay {
  private static callbacks = new Map<string, ResponseCallback>()
  private static accountRequestCallbackIds = new Set<string>()

  private readonly storage: ScopedLocalStorage

  private appName = ""
  private appLogoUrl: string | null = null
  private localStorageBlocked = false

  constructor() {
    this.storage = new ScopedLocalStorage(
        `__WalletLink__:trust`
    );
  }

  public setAppInfo(appName: string, appLogoUrl: string | null): void {
    this.appName = appName
    this.appLogoUrl = appLogoUrl
  }

  public injectIframe(): void {
    console.log(`Inject iframe`);
    window.trustMessage = this.handleMessage;
  }

  public getStorageItem(key: string): string | null {
    return this.storage.getItem(key)
  }

  public setStorageItem(key: string, value: string): void {
    this.storage.setItem(key, value)
  }

  public requestEthereumAccounts(): Promise<RequestEthereumAccountsResponse> {
    return this.sendRequest<
        RequestEthereumAccountsRequest,
        RequestEthereumAccountsResponse
        >({
      method: Web3Method.requestEthereumAccounts,
      params: {
        appName: this.appName,
        appLogoUrl: this.appLogoUrl || null
      }
    })
  }

  public signEthereumMessage(
      message: Buffer,
      address: AddressString,
      addPrefix: boolean,
      typedDataJson?: string | null
  ): Promise<SignEthereumMessageResponse> {
    return this.sendRequest<
        SignEthereumMessageRequest,
        SignEthereumMessageResponse
        >({
      method: Web3Method.signEthereumMessage,
      params: {
        message: hexStringFromBuffer(message, true),
        address,
        addPrefix,
        typedDataJson: typedDataJson || null
      }
    })
  }

  public ethereumAddressFromSignedMessage(
      message: Buffer,
      signature: Buffer,
      addPrefix: boolean
  ): Promise<EthereumAddressFromSignedMessageResponse> {
    return this.sendRequest<
        EthereumAddressFromSignedMessageRequest,
        EthereumAddressFromSignedMessageResponse
        >({
      method: Web3Method.ethereumAddressFromSignedMessage,
      params: {
        message: hexStringFromBuffer(message, true),
        signature: hexStringFromBuffer(signature, true),
        addPrefix
      }
    })
  }

  public signEthereumTransaction(
      params: EthereumTransactionParams
  ): Promise<SignEthereumTransactionResponse> {
    return this.sendRequest<
        SignEthereumTransactionRequest,
        SignEthereumTransactionResponse
        >({
      method: Web3Method.signEthereumTransaction,
      params: {
        fromAddress: params.fromAddress,
        toAddress: params.toAddress,
        weiValue: bigIntStringFromBN(params.weiValue),
        data: hexStringFromBuffer(params.data, true),
        nonce: params.nonce,
        gasPriceInWei: params.gasPriceInWei
            ? bigIntStringFromBN(params.gasPriceInWei)
            : null,
        gasLimit: params.gasLimit ? bigIntStringFromBN(params.gasLimit) : null,
        chainId: params.chainId,
        shouldSubmit: false
      }
    })
  }

  public signAndSubmitEthereumTransaction(
      params: EthereumTransactionParams
  ): Promise<SubmitEthereumTransactionResponse> {
    return this.sendRequest<
        SignEthereumTransactionRequest,
        SubmitEthereumTransactionResponse
        >({
      method: Web3Method.signEthereumTransaction,
      params: {
        fromAddress: params.fromAddress,
        toAddress: params.toAddress,
        weiValue: bigIntStringFromBN(params.weiValue),
        data: hexStringFromBuffer(params.data, true),
        nonce: params.nonce,
        gasPriceInWei: params.gasPriceInWei
            ? bigIntStringFromBN(params.gasPriceInWei)
            : null,
        gasLimit: params.gasLimit ? bigIntStringFromBN(params.gasLimit) : null,
        chainId: params.chainId,
        shouldSubmit: true
      }
    })
  }

  public submitEthereumTransaction(
      signedTransaction: Buffer,
      chainId: IntNumber
  ): Promise<SubmitEthereumTransactionResponse> {
    return this.sendRequest<
        SubmitEthereumTransactionRequest,
        SubmitEthereumTransactionResponse
        >({
      method: Web3Method.submitEthereumTransaction,
      params: {
        signedTransaction: hexStringFromBuffer(signedTransaction, true),
        chainId
      }
    })
  }

  public scanQRCode(regExp: RegExpString): Promise<ScanQRCodeResponse> {
    return this.sendRequest<ScanQRCodeRequest, ScanQRCodeResponse>({
      method: Web3Method.scanQRCode,
      params: { regExp }
    })
  }

  public arbitraryRequest(data: string): Promise<ArbitraryResponse> {
    return this.sendRequest<ArbitraryRequest, ArbitraryResponse>({
      method: Web3Method.arbitrary,
      params: { data }
    })
  }

  public sendRequest<T extends Web3Request, U extends Web3Response>(
      request: T
  ): Promise<U> {
    if (this.localStorageBlocked) {
      walletLinkBlockedDialog.show()
      return Promise.reject(new Error(BLOCKED_LOCAL_STORAGE_ERROR_MESSAGE))
    }
    return new Promise((resolve, reject) => {
      const id = crypto.randomBytes(8).toString("hex")

      const isRequestAccounts =
          request.method === Web3Method.requestEthereumAccounts

      if (isRequestAccounts) {
        TrustRelay.accountRequestCallbackIds.add(id)
      }

      TrustRelay.callbacks.set(id, response => {
        if (response.errorMessage) {
          return reject(new Error(response.errorMessage))
        }
        console.log(`resolve promise`);
        console.log(JSON.stringify(response));
        resolve(response as U)
      })

      this.postIPCMessage(Web3RequestMessage({ id, request }))
    })
  }

  @bind
  private handleMessage(evt: MessageEvent): void {
    const message: Web3ResponseMessage = evt.data;

    if (isRequestEthereumAccountsResponse(message)) {
      Array.from(TrustRelay.accountRequestCallbackIds.values()).forEach(
          id => this.invokeCallback({ ...message, id })
      )
      TrustRelay.accountRequestCallbackIds.clear()
      return
    }

    this.invokeCallback(message)
    return

  }

  private invokeCallback(message: Web3ResponseMessage) {
    console.log(`Got callback`);
    console.log(JSON.stringify(message));
    const callback = TrustRelay.callbacks.get(message.id)
    if (callback) {
      console.log(`sent callback`);
      console.log(JSON.stringify(message.response));
      callback(message.response)
      TrustRelay.callbacks.delete(message.id)
    }
  }

  private postIPCMessage(message: IPCMessage): void {
    console.log(`Sending message:`);
    console.log(JSON.stringify(message));
    window.webkit.messageHandlers[message.request.method].postMessage(message);
  }
}
