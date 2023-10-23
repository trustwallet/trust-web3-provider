module.exports = {
  env: {
    browser: true,
    node: true,
    commonjs: true,
    es6: true,
    jest: true,
  },
  extends: "eslint:recommended",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
  },
  rules: {
    "linebreak-style": ["error", "unix"],
    quotes: ["warn", "double"],
    semi: ["error", "always"],
    "no-console": ["off"],
  },
};
