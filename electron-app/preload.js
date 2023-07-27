const { contextBridge, ipcRenderer } = require("electron");

/**
 * Load in a context bridge so the GumbandWrapper class an the Electron app can communicate.
 */
contextBridge.exposeInMainWorld(
  "gb", {
    send: (channel, data) => {
      let validChannels = ["fromGumband", "fromElectron"];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
      let validChannels = ["fromGumband", "fromElectron"];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    }
  }
);
