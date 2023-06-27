const path = require('path')
const htmlPlugin = require('html-webpack-plugin')
const copyPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: './Audio/main.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.(jpe?g|.png)$/,
        type: "asset", // 大于80kb的图片会转为base64
        parser: {
          maxSize: 80 * 1024
        }
      },
      {
        test: /\.(mp3)$/,
        type: "asset/resource"
      }
    ]
  },
  plugins: [
    new htmlPlugin({
      template: path.resolve(__dirname, './Audio/template/index.html')
    }),
    new copyPlugin({
      patterns: [{ from: path.resolve(__dirname, './Audio/assets'), to: path.resolve(__dirname, './dist/assets') }]
    })
  ],
  mode: 'development'
}
