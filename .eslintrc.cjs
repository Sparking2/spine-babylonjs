module.exports = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/strict-type-checked", "plugin:@typescript-eslint/stylistic-type-checked","plugin:prettier/recommended"],
  parser: "@typescript-eslint/parser",
  rules: {
    "prettier/prettier": "error"
  },
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  plugins: ["@typescript-eslint", "prettier"],
  root: true,
};