before_install:
  - rm -rf android/lib/src/main/res/raw/trust.js
  - mkdir -pv android/lib/src/main/res/raw/
  - git lfs fetch --all
  - git lfs checkout dist/trust-min.js
  - cp dist/trust-min.js android/lib/src/main/res/raw/trust_min.js
