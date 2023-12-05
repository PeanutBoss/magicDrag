const htmlPlugin = require('html-webpack-plugin')
const path = require('path')
const vueLoader = require('vue-loader')

function createDefaultConfig (entry, output, templatePath, port = 9001) {
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
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'] // 自动追加的文件后缀名
    },
    devServer: {
      port,
      open: true
    },
    mode: 'development'
  }
}

module.exports = {
  createDefaultConfig
}
