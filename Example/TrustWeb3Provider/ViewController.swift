//
//  ViewController.swift
//  TrustWeb3Provider
//
//  Created by hewigovens on 02/15/2018.
//  Copyright (c) 2018 hewigovens. All rights reserved.
//

import UIKit

class ViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

        let bundlePath = Bundle.main.path(forResource: "TrustWeb3Provider", ofType: "bundle")
        let bundle = Bundle(path: bundlePath!)!
        let jsPath = bundle.path(forResource: "trust-min", ofType: "js")
        let data = NSData(contentsOfFile: jsPath!)
        print(data?.length)
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

}

