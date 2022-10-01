module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    // See https://github.com/prettier/eslint-config-prettier/blob/main/CHANGELOG.md#version-800-2021-02-21
    "plugin:prettier/recommended",
  ],
  plugins: ["prettier"],
  env: {
    node: true,
    es2020: true
  },
  rules: {
    "prettier/prettier": "error",
  },
  overrides: [
    {
      "files": "*.mjs",
      "parserOptions": {
        "sourceType": "module"
      }
    }
  ]
};
