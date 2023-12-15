const htmlPlugin = require('html-webpack-plugin')
const path = require('path')
const vueLoader = require('vue-loader')
const ESLintPlugin = require('eslint-webpack-plugin')

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
      }),
      new ESLintPlugin({
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      })
    ],
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'] // 自动追加的文件后缀名
    },
    devServer: {
      port,
      open: false
    },
    mode: 'development',
    devtool: 'source-map'
  }
}

module.exports = {
  createDefaultConfig
}
