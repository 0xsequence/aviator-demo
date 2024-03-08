const path = require('path');
const pkg = require('./package.json');
const {ENV} = require('./env.example.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
const buildPath = './build/';
const webpack = require('webpack');

module.exports = {
  entry: ['./src/entry.js'],
  output: {
    path: path.join(__dirname, buildPath),
    filename: '[name].[hash].js'
  },
  mode: 'development',
  target: 'web',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$|jsx/,
        use: 'babel-loader',
        exclude: path.resolve(__dirname, './node_modules/'),
      },{
        test: /\.(jpe?g|png|gif|svg|tga|glb|babylon|mtl|pcb|pcd|prwm|obj|mat|mp3|ogg)$/i,
        type: 'asset/resource',
        exclude: path.resolve(__dirname, './node_modules/'),
        generator: {
          filename: 'assets/[name].[ext]'
        }
      },{
        test: /\.css$/,
        use: [
            'style-loader',
            'css-loader',
          ],
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new HtmlWebpackPlugin({
      'title': 'Aviator Sequence Demo',
      'template': './src/index.html'
    }),
    new webpack.DefinePlugin({
      'ENV': !Boolean(process.env.DEPLOY) ? JSON.stringify({
        projectAccessKey: JSON.stringify(process.env.projectAccessKey),
        waasConfigKey: JSON.stringify(process.env.waasConfigKey),
        projectId: JSON.stringify(process.env.projectId),
        walletConnectId: JSON.stringify(process.env.walletConnectId),
        identityPoolId: JSON.stringify(process.env.identityPoolId),
        emailClientId: JSON.stringify(process.env.emailClientId),
        googleClientId: JSON.stringify(process.env.googleClientId),
        idpRegion: JSON.stringify(process.env.idpRegion),
        rpcServer: JSON.stringify(process.env.rpcServer),
        kmsRegion: JSON.stringify(process.env.kmsRegion),
        emailRegion: JSON.stringify(process.env.emailRegion),
        keyId: JSON.stringify(process.env.keyId)
      }) : JSON.stringify(ENV),
    }),
  ],
  resolve: {
    fallback: {
      // other fallbacks...
      "buffer": require.resolve("buffer/")
    }
  }
}
