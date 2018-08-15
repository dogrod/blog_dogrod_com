import * as fs from 'fs'
import * as path from 'path'
import * as Koa from 'koa'
import axios from 'axios'

import Logger from '../utils/logger'

const paths = require('../../config/paths')

const appConfig = require(paths.appConfig)
const bundleDir = appConfig.bundleDir || 'dist'

const { isDev } = require(paths.env)

const logger = Logger('spa')

// Detect if match ant static file extension in the end of path
const REG_STATIC_FILE = /\.(js|css|gif|jpg|jpeg|png|bmp|svg|woff|woff2|eot|ttf)(\?.*)?$/i
// default filter rule
const REG_DEFAULT_FILTER = /^\/api/

/**
 * Read bundled file
 * @param {string} filePath file path
 * @return {string} file content
 */
const readBundleFile = (filePath: string) => fs.readFileSync(path.join(process.cwd(), bundleDir, filePath), 'utf-8')

export default (filter = REG_DEFAULT_FILTER) => {
  return async (ctx: Koa.Context, next: () => void) => {
    // Filter match
    if (filter.test(ctx.path)) {
      logger.info(
        'Catch a request which match filter rule(default is /^\/api/).',
        ctx.method,
        ctx.url,
        'Skip from SPA middleware.'
      )
      return next()
    }

    // Detect static file
    if (REG_STATIC_FILE.test(ctx.path)) {
      logger.info(
        'Catch a static file request',
        ctx.method,
        ctx.url,
        'Skip from SPA middleware'
      )
      return next()
    }

    logger.info(
      'Catch a SPA request',
      ctx.method,
      ctx.url
    )

    // If NODE_ENV is development, retrieving page from webpack-serve
    if (isDev) {
      const ip = require('ip')
      const currentIP = ip.address()
      const webpackServePort = parseInt(appConfig.port, 10) + 100 || 9101
      const INDEX_PATH = `http://${currentIP}:${webpackServePort}/index.html`
      
      logger.info(`Retrieving page from webpack serve --> ${INDEX_PATH}`)
      return axios.get(INDEX_PATH)
        .then((response) => {
          ctx.body = response.data
        })
        .catch((error) => Promise.reject(error))
    }

    // Continue with production environment.
    logger.info('Return index.html file from bundle directory.')

    ctx.set('Content-Type', 'text/html; charset=utf-8')
    ctx.body = readBundleFile('index.html')
    return Promise.resolve()
  }
}
