export declare type JsonRpcVersion = '2.0';

export declare type JsonRpcId = number | string | void;

export interface JsonRpcResponseBase {
  jsonrpc: JsonRpcVersion;
  id: JsonRpcId;
}
