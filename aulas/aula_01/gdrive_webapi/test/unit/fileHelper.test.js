import {
  describe,
  it,
  expect,
  jest,
  test
} from "@jest/globals"
import fs from 'fs'
import FileHelper from "../../src/fileHelper.js"

describe("#FileHelper test suite", () => {

  describe("#getFilesStatus", () => {

    it('should return a list of items in the correct format', async () => {
      // arrange      
      const fsStateSyncMock = {
        dev: 2064,
        mode: 33188,
        nlink: 1,
        uid: 1000,
        gid: 1000,
        rdev: 0,
        blksize: 4096,
        ino: 1313732,
        size: 97862,
        blocks: 192,
        atimeMs: 1631035573031.9407,
        mtimeMs: 1631035572581.9407,
        ctimeMs: 1631035572581.9407,
        birthtimeMs: 1631035572571.9407,
        atime: '2021-09-07T17:26:13.032Z',
        mtime: '2021-09-07T17:26:12.582Z',
        ctime: '2021-09-07T17:26:12.582Z',
        birthtime:'2021-09-07T17:26:12.572Z'
      }

      const mockUser = 'guilospanck'
      process.env.USER = mockUser
      const filename = 'file.png'
      jest.spyOn(fs.promises, fs.promises.readdir.name).mockResolvedValue([filename])
      jest.spyOn(fs.promises, fs.promises.stat.name).mockResolvedValue(fsStateSyncMock)
      
      const expectedResult = [{
        size: '97.9 kB',
        lastModified: fsStateSyncMock.birthtime,
        owner: mockUser,
        file: filename
      }]
      

      // act
      const result = await FileHelper.getFilesStatus('/tmp')

      // assert
      expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${filename}`)
      expect(result).toMatchObject(expectedResult)
    })

  })

})