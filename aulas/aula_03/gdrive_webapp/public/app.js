import AppController from "./src/appController.js"
import ConnectionManager from "./src/connectionManager.js"
import DragAndDropManager from "./src/dragAndDropManager.js"
import ViewManager from "./src/viewManager.js"

// const API_URL = "https://localhost:3000/"
const API_URL = "https://gdrive-webapi-guilospanck.herokuapp.com/" // from heroku

const appController = new AppController({
  connectionManager: new ConnectionManager({
    apiUrl: API_URL
  }),
  viewManager: new ViewManager(),
  dragAndDropManager: new DragAndDropManager()
})

try {
  await appController.initialize()
} catch (error) {
  console.error('error on initializing', error)
}