const vueTemplateConfig = require('./vueTemplate.config')
const { createDefaultConfig } = require('./default.config')
const mergeConfig = require('webpack-merge').default
const path = require('path')

const defaultConfig = createDefaultConfig(
  path.resolve(__dirname, '../exampleYG/main.ts'),
  { path: path.resolve(__dirname, '../exampleDist') },
  path.resolve(__dirname, '../exampleYG/index.html'),
  9003
)

module.exports = mergeConfig(defaultConfig, vueTemplateConfig)
