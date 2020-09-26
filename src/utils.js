// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

"use strict";

import { Buffer } from 'buffer';

class Utils {
  static genId() {
    return new Date().getTime() + Math.floor(Math.random() * 1000);
  }

  static flatMap(array, func) {
    return [].concat(...array.map(func));
  }

  static intRange(from, to) {
    if (from >= to) {
      return [];
    }
    return new Array(to - from).fill().map((_, i) => i + from);
  }

  static hexToInt(hexString) {
    if (hexString === undefined || hexString === null) {
      return hexString;
    }
    return Number.parseInt(hexString, 16);
  }

  static intToHex(int) {
    if (int === undefined || int === null) {
      return int;
    }
    let hexString = int.toString(16);
    return "0x" + hexString;
  }

  static hexToBuffer(str) {
    return Buffer.from(str.replace('0x', ''), 'hex');
  }

  static bufferToHex(buf) {
    return Buffer.from(buf).toString('hex');
  }
}

module.exports = Utils;
