module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', '@typescript-eslint/eslint-plugin'],
  rules: {
    'no-unused-vars': 'off',
    // "indent": ["error", 2],
    // "no-tabs": "off",
    // "no-mixed-spaces-and-tabs": "off",
    'no-trailing-spaces': 'error',
    'object-curly-spacing': ['error', 'always'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'never']
  }
}
