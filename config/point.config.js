const mergeConfig = require('webpack-merge')
const { createDefaultConfig } = require('./default.config')
const path = require('path')

const defaultConfig = createDefaultConfig(
  path.resolve(__dirname, '../dragResize/point.ts'),
  {
    path: path.resolve(__dirname, '../pointDist'),
    clean: true
  },
  path.resolve(__dirname, '../dragResize/template.html')
)

module.exports = defaultConfig
