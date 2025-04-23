const path = require('path');

module.exports = {
  // ... keeping any existing config
  resolve: {
    extensions: ['.js', '.mjs'],
    alias: {
      'undici': false // This will force webpack to use node's native fetch
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              '@babel/plugin-proposal-private-methods',
              '@babel/plugin-proposal-class-properties'
            ]
          }
        }
      }
    ]
  }
};