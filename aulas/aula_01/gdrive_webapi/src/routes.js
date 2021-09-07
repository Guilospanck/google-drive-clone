import { logger } from './logger.js'

export default class Routes {
  io
  constructor(){

  }

  setSocketInstance(io){
    this.io = io
  }

  async defaultRoute(request, response) {
    response.end(`Hello world`)
  }

  async options(request, response) {
    response.writeHead(204)
  }

  async post(request, response) {
    logger.info("POST")
    response.end('Post')
  }

  async get(request, response) {
    logger.info("GET")
    response.end('Get')
  }

  handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*')
    const chosen = this[request.method.toLowerCase()] || this.defaultRoute
    return chosen.apply(this, [request, response])
  }
}