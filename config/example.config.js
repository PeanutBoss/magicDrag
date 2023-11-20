const vueTemplateConfig = require('./vueTemplate.config')
const { createDefaultConfig } = require('./default.config')
const mergeConfig = require('webpack-merge').default
const path = require('path')

const defaultConfig = createDefaultConfig(
  path.resolve(__dirname, '../exampleDrag/main.ts'),
  { path: path.resolve(__dirname, '../exampleDist') },
  path.resolve(__dirname, '../exampleDrag/index.html')
)

module.exports = mergeConfig(defaultConfig, vueTemplateConfig, { devServer: { port: 9002, open: true, hot: true } })
