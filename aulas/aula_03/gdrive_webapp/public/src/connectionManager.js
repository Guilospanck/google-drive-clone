export default class ConnectionManager {
  constructor({ apiUrl }) {
    this.apiUrl = apiUrl
  }

  async currentFiles() {
    const result = await fetch(this.apiUrl)
    const files = await result.json()

    return files
  }
}