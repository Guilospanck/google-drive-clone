import {
  describe,
  it,
  expect,
  jest,
  test
} from "@jest/globals"

import Routes from '../../src/routes.js'

describe('#Routes test suite', () => {
  const defaultParams = {
    request: {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      method: '',
      bode: {}
    },
    response: {
      setHeader: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn(),
    },
    values: () => Object.values(defaultParams)
  }

  describe('#setSocketInstance', () => {
    it("should store io instance", () => {
      // arrange
      const routes = new Routes()
      const ioObj = {
        to: (id) => ioObj,
        emit: (event, message) => { }
      }

      // act
      routes.setSocketInstance(ioObj)

      // assert
      expect(routes.io).toStrictEqual(ioObj)
    })
  })

  describe('#handler', () => {  

    it("given an inexistant route it should choose default route", () => {
      // arrange
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      params.request.method = 'inexistent'

      // act
      routes.handler(...params.values())

      // assert
      expect(params.response.end).toHaveBeenCalledWith('Hello world')
    })
    it("should set any request with CORS enabled", () => {
      // arrange
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      params.request.method = 'inexistent'

      // act
      routes.handler(...params.values())

      // assert
      expect(params.response.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
    })
    it("given method OPTIONS it should choose options route", async () => {
      // arrange
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      params.request.method = 'OPTIONS'

      // act
      await routes.handler(...params.values())

      // assert
      expect(params.response.writeHead).toHaveBeenCalledWith(204)
      expect(params.response.end).toHaveBeenCalled()
    })
    it("given method POST it should choose post route", async () => {
      // arrange
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      params.request.method = 'POST'
      jest.spyOn(routes, routes.post.name).mockResolvedValueOnce()

      // act
      await routes.handler(...params.values())

      // assert
      expect(routes.post).toHaveBeenCalled()
    })
    it("given method GET it should choose get route", async () => {
      // arrange
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      params.request.method = 'GET'
      jest.spyOn(routes, routes.get.name).mockResolvedValueOnce()


      // act
      await routes.handler(...params.values())

      // assert
      expect(routes.get).toHaveBeenCalled()
    })

  })

  describe('#get', () => {
    it('given method GET it should list all files downloaded', async () => {
      // arrange
      const route = new Routes()
      const params = {
        ...defaultParams
      }
      const fileStatusesMock = [{
        size: '97.9 kB',
        lastModified: '2021-09-07T17:26:12.572Z',
        owner: 'guilospanck',
        file: 'file.txt'
      }]
      jest.spyOn(route.fileHelper, route.fileHelper.getFilesStatus.name).mockResolvedValue(fileStatusesMock)
      params.request.method = 'GET'

      // act
      await route.handler(...params.values())

      // assert
      expect(params.response.writeHead).toHaveBeenCalledWith(200)
      expect(params.response.end).toHaveBeenCalledWith(JSON.stringify(fileStatusesMock))
    })
  })

})