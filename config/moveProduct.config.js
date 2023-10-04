const htmlPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
  entry: path.resolve(__dirname, '../magicDrag/useMoveElement.ts'),
  output: {
    path: path.resolve(__dirname, '../moveDist'),
    library: {
      type: 'module', // 指定为ESM模块
    },
    clean: true
  },
  experiments: {
    outputModule: true, // 启用实验性的输出模块功能
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'] // 自动追加的文件后缀名
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
        test: /\.s(a|c)ss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
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
  // plugins: [
  //   new htmlPlugin({
  //     template: path.resolve(__dirname, '../magicDrag/template.html'),
  //     favicon: path.resolve(__dirname, '../magicDrag/assets/favicon.ico'),
  //     inject: 'head' // 将css插入head标签
  //   })
  // ],
  // resolve: {
  //   extensions: ['.ts', '.json', '.tsx']
  // },
  devServer: {
    // open: true,
    port: 9003,
    hot: true
  },
  mode: 'production'
}

