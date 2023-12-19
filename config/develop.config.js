const vueTemplateConfig = require('./vueTemplate.config')
const { createDefaultConfig } = require('./default.config')
const mergeConfig = require('webpack-merge').default
const path = require('path')

const defaultConfig = createDefaultConfig(
  path.resolve(__dirname, '../exampleDevelop/main.ts'),
  { path: path.resolve(__dirname, '../developDist') },
  path.resolve(__dirname, '../exampleDevelop/index.html'),
  9005
)

module.exports = mergeConfig(defaultConfig, vueTemplateConfig)
