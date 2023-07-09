const htmlPlugin = require('html-webpack-plugin')
const path = require('path')
const vueLoader = require('vue-loader')

module.exports = {
  entry: path.resolve(__dirname, '../dragContainer/main.ts'),
  output: {
    path: path.resolve(__dirname, '../containerDist'),
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
        test: /\.vue$/,
        use: [
          {
            loader: 'vue-loader',
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
      template: path.resolve(__dirname, '../dragContainer/index.html')
    }),
    new vueLoader.VueLoaderPlugin()
  ],
  devServer: {
    port: 8080
  },
  mode: 'development'
}
