module.exports = {
  root: true,
  env: {
    es6: true,
    node: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 2015,
    sourceType: 'module'
  },
  rules: {
    "strict": [0],
    "eqeqeq": 2,
    "quotes": [2, "single", { "allowTemplateLiterals": true }],
    "no-underscore-dangle": 0,
    "eol-last": 0,
    "camelcase": 0,
    "no-loop-func": 0,
    "no-trailing-spaces": 0,
    "consistent-return": 0,
    "new-cap": 0,
    "no-shadow": 0,
    "no-process-exit": 0,
    "no-empty": 0,
    "yoda": 0,
    "no-new-func": 0,
    "semi": ["error", "never"]
  },
  globals: {
    getApp: false,
    Page: false,
    wx: false,
    App: false,
    getCurrentPages: false,
    Component: false
  }
};
