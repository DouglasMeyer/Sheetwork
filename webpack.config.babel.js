import { HotModuleReplacementPlugin } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CleanWebpackPlugin from 'clean-webpack-plugin';
const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  output: { publicPath: '/Sheetwork/' },
  devtool: isDevelopment ? 'eval' : 'source-map',
  devServer: {
    historyApiFallback: {
      rewrites: [
        { from: /./, to: '/Sheetwork/' }
      ]
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(['dist'], { exclude: ['.git', '404.html'] }),
    new HtmlWebpackPlugin({
      title: 'Sheetwork'
    }),
    new HotModuleReplacementPlugin()
  ]
};
