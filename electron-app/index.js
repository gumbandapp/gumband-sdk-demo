const { app, BrowserWindow } = require('electron');
const { GumbandService } = require('../gumband/gumband-service');

let win;
let gb;

const createWindow = () => {
  win = new BrowserWindow({
    width: 700,
    height: 1000,
    webPreferences: {
      preload: `${__dirname}/preload.js`
    }
  })

  win.loadFile('index.html');
  return win;
}

app.whenReady().then(() => {
  createWindow();
  gb = new GumbandService(win);
});


