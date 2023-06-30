const htmlPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
  entry: path.resolve(__dirname, '../movePointer/main.ts'),
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
      }
    ]
  },
  plugins: [
    new htmlPlugin({
      template: path.resolve(__dirname, '../movePointer/template.html')
    })
  ],
  resolve: {
    extensions: ['.ts', 'json', '.tsx']
  },
  devServer: {
    open: true,
    port: 9001
  },
  mode: 'development'
}
