const htmlPlugin = require('html-webpack-plugin')
const path = require('path')
const vueLoader = require('vue-loader')

function createDefaultConfig (entry, output, templatePath) {
  return {
    entry,
    output,
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true
              }
            }
          ]
        },
        {
          test: /\.s(c|a)ss$/,
          use: [
            'style-loader',
            'css-loader',
            'sass-loader'
          ]
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader'
          ]
        }
      ]
    },
    plugins: [
      new htmlPlugin({
        template: templatePath
      })
    ],
    devServer: {
      port: 8080,
      open: true
    },
    mode: 'development'
  }
}

module.exports = {
  createDefaultConfig
}
