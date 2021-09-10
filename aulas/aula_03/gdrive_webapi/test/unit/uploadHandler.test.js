import {
  describe,
  it,
  expect,
  jest,
  beforeEach
} from "@jest/globals"
import TestUtil from "../_util/testUtil"
import UploadHandler from "../../src/uploadHandler"
import fs from 'fs'
import { resolve } from 'path'
import { pipeline } from 'stream/promises'
import { logger } from '../../src/logger'

describe("#UploadHandler test suite", () => {

  const ioObj = {
    to: (id) => ioObj,
    emit: (event, message) => {}
  }

  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation()
  })

  describe('#registerEvents', () => {

    it('should call onFile and onFinish functions on BusBoy instance', () => {
      // arrange
      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '01'
      })
      jest.spyOn(uploadHandler, uploadHandler.onFile.name).mockResolvedValue()
      const headers = {
        'content-type': 'multipart/form-data; boundary='
      }
      const onFinish = jest.fn()

      // act
      const busboyInstance = uploadHandler.registerEvents(headers, onFinish)

      const fileStream = TestUtil.generateReadableStream(['chunk', 'of', 'data']) // readable stream is who will send us data (who will upload a file)
      busboyInstance.emit('file', 'fieldname', fileStream, 'filename.txt')

      busboyInstance.listeners("finish")[0].call()

      // assert
      expect(uploadHandler.onFile).toHaveBeenCalled()
      expect(onFinish).toHaveBeenCalled()
    })

  })

  describe('#onFile', () => {
    it('given a stream file it should save it on disk', async () => {
      // arrange
      const chunks = ['hey', 'dude']
      const downloadsFolder = '/tmp'
      const handler = new UploadHandler({
        io: ioObj,
        socketId: '01',
        downloadsFolder
      })

      const onData = jest.fn()
      jest.spyOn(fs, fs.createWriteStream.name).mockImplementation(() => TestUtil.generateWritableStream(onData))
      const onTransform = jest.fn()
      jest.spyOn(handler, handler.handleFileBytes.name).mockImplementation(() => TestUtil.generateTransformStream(onTransform))

      const params = {
        fieldname: 'video',
        file: TestUtil.generateReadableStream(chunks),
        filename: 'mockFile.mov'
      }

      const expectedFilename = resolve(handler.downloadsFolder, params.filename)

      // act
      await handler.onFile(...Object.values(params))

      // assert
      expect(onData.mock.calls.join()).toEqual(chunks.join())
      expect(onTransform.mock.calls.join()).toEqual(chunks.join())
      expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFilename)

    })
  })

  describe('#handleFileBytes', () => {
    it('should call emit function and it is a transform stream', async () => {
      // arrange
      jest.spyOn(ioObj, ioObj.to.name)
      jest.spyOn(ioObj, ioObj.emit.name)

      const handler = new UploadHandler({
        io: ioObj,
        socketId: '01'
      })

      jest.spyOn(handler, handler.canExecute.name).mockReturnValue(true)

      const messages = ['hello']
      const source = TestUtil.generateReadableStream(messages)
      const onWrite = jest.fn()
      const target = TestUtil.generateWritableStream(onWrite)

      // act
      await pipeline(
        source,
        handler.handleFileBytes('filename.txt'),
        target
      )

      // assert
      expect(ioObj.to).toHaveBeenCalledTimes(messages.length) // ioObj.to(socketId).emit('evento', 'mensagem')
      expect(ioObj.emit).toHaveBeenCalledTimes(messages.length)

      // If handleFileBytes is a tranform stream, our pipeline will continue the process, passing data forward
      // and calling our function on the target at each chunk
      expect(onWrite).toBeCalledTimes(messages.length)
      expect(onWrite.mock.calls.join()).toEqual(messages.join())


    })

    it('given messageTimeDelay as 2s it should emit only two messages during 2s period', async () => {
      // arrange
      jest.spyOn(ioObj, ioObj.emit.name)
      const messageTimeDelay = 2000

      const day = '2021-07-01 01:01'
      const onFirstLastMessageSent = TestUtil.getTimeFromDate(`${day}:00`)
      const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:02`) // hello chegou
      const onSecondUpdateLastMessageSent = onFirstCanExecute
      const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:03`) // segundo hello está fora da janela de tempo
      const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:04`) // world
      
      TestUtil.mockDateNow(
        [
          onFirstLastMessageSent,
          onFirstCanExecute,
          onSecondUpdateLastMessageSent,
          onSecondCanExecute,
          onThirdCanExecute
        ]
      )

      const messages = ['hello', 'hello', 'world']
      const expectedMessageSent = 2
      const filename = 'filename.avi'

      const source = TestUtil.generateReadableStream(messages)
      const handler = new UploadHandler({
        messageTimeDelay,
        io: ioObj,
        socketId: '01'
      })

      // act
      await pipeline(
        source,
        handler.handleFileBytes(filename),

      )

      // assert
      expect(ioObj.emit).toHaveBeenCalledTimes(expectedMessageSent)

      const [firstCallResult, secondCallResult] = ioObj.emit.mock.calls
      expect(firstCallResult).toEqual([handler.ON_UPLOAD_EVENT, { processedAlready: 'hello'.length, filename }])
      expect(secondCallResult).toEqual([handler.ON_UPLOAD_EVENT, { processedAlready: 'hellohelloworld'.length, filename }])

    })
  })

  describe('#canExecute', () => {
    it('should return true when time is later than specified delay', () => {
      // arrange
      const timerDelay = 1000
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimeDelay: timerDelay
      })

      const tickNow = TestUtil.getTimeFromDate('2021-07-01 00:00:03')
      TestUtil.mockDateNow([tickNow])
      const lastExecution = TestUtil.getTimeFromDate('2021-07-01 00:00:00')

      // act
      const result = uploadHandler.canExecute(lastExecution)

      // assert
      expect(result).toBeTruthy()
    })

    it('should return false when time isn\'t later than specified delay', () => {
      // arrange
      const timerDelay = 3000
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimeDelay: timerDelay
      })

      const tickNow = TestUtil.getTimeFromDate('2021-07-01 00:00:02')
      TestUtil.mockDateNow([tickNow])
      const lastExecution = TestUtil.getTimeFromDate('2021-07-01 00:00:01')

      // act
      const result = uploadHandler.canExecute(lastExecution)

      // assert
      expect(result).toBeFalsy()
    })
  })

})