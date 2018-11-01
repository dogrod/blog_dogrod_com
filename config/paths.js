const fs = require('fs')
const path = require('path')

const appDirectory = fs.realpathSync(process.cwd())

const resolveAppPath = relativePath => path.resolve(appDirectory, relativePath)

module.exports = {
  babelConfig: resolveAppPath('config/babel.config.js'),
  favicon: resolveAppPath('favicon.ico'),
  htmlTemplate: resolveAppPath('index.template.ejs'),
  clientSrc: resolveAppPath('client'),
  serverSrc: resolveAppPath('server'),
  appConfig: resolveAppPath('app.config.js'),
  tsConfig: resolveAppPath('tsconfig.json'),
  env: resolveAppPath('config/env.js'),
  webpackBaseConfig: resolveAppPath('config/webpack.config.base.js'),
  webpackDevConfig: resolveAppPath('config/webpack.config.dev.js'),
  webpackProdConfig: resolveAppPath('config/webpack.config.prod.js'),
  bundlePath: resolveAppPath('dist'),
}