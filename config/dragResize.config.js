const htmlPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
  entry: path.resolve(__dirname, '../dragResize/main.ts'),
  output: {
    path: path.resolve(__dirname, '../moveDist'),
    clean: true
  },
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
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(jpe?g|png)$/,
        type: "asset", // 小于80kb的图片会转为base64
        // parser: {
        //   maxSize: 80 * 1024
        // }
      }
    ]
  },
  plugins: [
    new htmlPlugin({
      template: path.resolve(__dirname, '../dragResize/template.html'),
      inject: 'head' // 将css插入head标签
    })
  ],
  // resolve: {
  //   extensions: ['.ts', '.json', '.tsx']
  // },
  devServer: {
    // open: true,
    port: 9002,
    hot: true
  },
  mode: 'development'
}
