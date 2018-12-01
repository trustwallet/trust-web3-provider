//
//  DAppMethod.swift
//  TrustWeb3Provider_Example
//
//  Created by Tao Xu on 12/1/18.
//  Copyright © 2018 CocoaPods. All rights reserved.
//

import Foundation

enum DAppMethod: String, CaseIterable {
    case signTransaction
    case signTypedMessage
    case signPersonalMessage
    case signMessage
    case requestAccounts
}
