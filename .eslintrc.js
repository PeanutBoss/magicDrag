module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', '@typescript-eslint/eslint-plugin'],
  rules: {
    'no-unused-vars': 'off',
    'no-trailing-spaces': 'error',
    'object-curly-spacing': ['error', 'always'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'never']
  }
}
