import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  beforeAll,
  afterAll
} from "@jest/globals"
import FormData from 'form-data'
import fs from 'fs'
import { logger } from "../../src/logger"
import Routes from "../../src/routes"
import TestUtil from '../_util/testUtil'
import { tmpdir } from 'os'
import { join } from 'path'

describe("#Routes Integration Test suite", () => {
  let defaultDownloadsFolder = ''
  beforeAll(async () => {
    defaultDownloadsFolder = await fs.promises.mkdtemp(join(tmpdir(), 'downloads-'))
  })

  afterAll(async () => {
    await fs.promises.rm(defaultDownloadsFolder, { recursive: true })
  })

  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation()
  })

  describe('#getFileStatus', () => {
    const ioObj = {
      to: (id) => ioObj,
      emit: (event, message) => { }
    }    

    it('should upload file to the folder', async () => {
      // arrange
      const filename = 'logo-title-opengraph.png'
      const fileStream = fs.createReadStream(`./test/integration/mocks/${filename}`)
      const response = TestUtil.generateWritableStream(() => { })

      const form = new FormData()
      form.append('photo', fileStream)

      const defaultParams = {
        request: Object.assign(form, {
          headers: form.getHeaders(),
          method: 'POST',
          url: '?socketId=10'
        }),
        response: Object.assign(response, {
          setHeader: jest.fn(),
          writeHead: jest.fn(),
          end: jest.fn(),
        }),
        values: () => Object.values(defaultParams)
      }
      const expectedResult = JSON.stringify({result: 'Files uploaded with success!'})

      const routes = new Routes(defaultDownloadsFolder)
      routes.setSocketInstance(ioObj)

      // act
      const dirBeforeRan = await fs.promises.readdir(defaultDownloadsFolder)
      expect(dirBeforeRan).toEqual([])

      await routes.handler(...defaultParams.values())
      
      // assert
      const dirAfterRan = await fs.promises.readdir(defaultDownloadsFolder)
      expect(dirAfterRan).toEqual([filename])

      expect(defaultParams.response.writeHead).toHaveBeenCalledWith(200)
      expect(defaultParams.response.end).toHaveBeenCalledWith(expectedResult)


    })
  })

})