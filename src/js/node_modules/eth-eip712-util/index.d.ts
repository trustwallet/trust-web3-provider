declare module "eth-eip712-util" {
  const module: {
    hashForSignTypedDataLegacy: (params: { data: any }) => Buffer
    hashForSignTypedData_v3: (params: { data: any }) => Buffer
    hashForSignTypedData_v4: (params: { data: any }) => Buffer
  }

  export = module
}
