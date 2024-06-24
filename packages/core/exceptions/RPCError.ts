export class RPCError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super();
    this.code = code;
    this.message = message;
  }

  toString() {
    return `${this.message} (${this.code})`;
  }
}
