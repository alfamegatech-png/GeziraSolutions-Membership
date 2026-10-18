const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  target: 'node',
  mode: 'production',
  resolve: {
    extensions: ['.js', '.json'],
  },
  externals: {
    sequelize: 'commonjs sequelize',
    pg: 'commonjs pg',
  },
  optimization: {
    minimize: true,
  },
  ignoreWarnings: [
    {
      message: /Critical dependency: the request of a dependency is an expression/,
    },
  ],
};
