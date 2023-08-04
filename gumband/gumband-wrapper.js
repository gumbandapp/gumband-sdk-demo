const { Gumband, Sockets } = require("@deeplocal/gumband-node-sdk");
const fs = require('fs');
const { ipcMain } = require("electron");

/**
 * A class that wraps the Gumband SDK and handles websocket messages that come from the Gumband Cloud.
 */
class GumbandWrapper {
    /**
     * A reference to the window object of the Electron app frontend.
     */
    window;
    /**
     * A reference to the Gumband SDK instance.
     */
    sdk;
    /**
     * Whether the exhibit is in operation mode. Configured in the Gumband UI.
     */
    opMode;

    constructor(window) {
        this.window = window;
        this.sdk = new Gumband(
            process.env.EXHIBIT_TOKEN,
            process.env.EXHIBIT_ID,
            `${__dirname}/manifest.json`,
            {
                contentLocation: './electron-app/content',
                gbttEnabled: true,
                gbttPort: process.env.EXHIBIT_GBTT_PORT
            }
        );
        this.addSDKListeners();
        this.addElectronAppListeners();
    }

    /**
     * Add listeners on the Gumband SDK websocket connection to the Gumband Cloud.
     */
    addSDKListeners() {
        this.sdk.on(Sockets.READY, async (manifest) => {
            this.opMode = manifest.opMode === "On";

            await this.addSeedImages();
            this.updateFrontendFromSettings();
        });

        this.sdk.on(Sockets.OP_MODE_RECEIVED, (payload) => {
            this.opMode = payload.value;
            this.sdk.logger.info(`OP_MODE changed to: ${payload.value}`);

            if(this.opMode) {
                this.updateFrontendFromSettings();
            } else {
                this.frontendStandbyMode();
            }
        });

        this.sdk.on(Sockets.SETTING_RECEIVED, (payload) => {
            this.sdk.logger.info(`${payload.id} setting updated to: ${payload.value}`);

            this.updateFrontendFromSettings();
        });

        this.sdk.on(Sockets.CONTROL_RECEIVED, async (payload) => {
            this.sdk.logger.info(`Control triggered: ${payload.id}`);
            
            if(payload.id === "toggle-game-mode") {
                this.sdk.setSetting(
                    "game-mode", 
                    !this.convertToBoolean(
                        (await this.sdk.getSetting("game-mode")).value
                    )
                );
            } else if (payload.id === "reload-frontend") {        
                this.window.reload();
                setTimeout(() => {
                    this.updateFrontendFromSettings();
                }, 100);
            }
        });

        this.sdk.on(Sockets.HARDWARE_PROPERTY_RECEIVED, async (payload) => {
            if(payload.peripheral === "Button" && payload.value === 0) {
                this.sdk.setSetting(
                    "game-mode", 
                    !this.convertToBoolean(
                        (await this.sdk.getSetting("game-mode")).value
                    )
                );
            }
        });
    }

    /**
     * Add listeners for events sent from the Electron App.
     */
    addElectronAppListeners() {
        ipcMain.on("fromElectron", async (event, data) => {
            if (data.type === "game-completed") {
                this.sdk.event.create("game-completed", { 
                    "targets-clicked": data.value,
                    "game-duration": await this.getSettingValue("game-group/game-duration")
                });
                this.sdk.setStatus("last-game-played", new Date().toString());
            }
        });
    }

    /**
     * Set the electron frontend app to standby mode.
     */
    frontendStandbyMode() {
        this.window.webContents.send("fromGumband", { type: "stand-by", value: true });
        this.sdk.setStatus("screen-status", "Standby Screen");
    }

    /**
     * Update the electron frontend app with the settings configured in Gumband.
     */
    async updateFrontendFromSettings() {
        if(!this.opMode) {
            return;
        }
        const header = await this.getSettingValue("signage-group/header");
        const subheader = await this.getSettingValue("signage-group/subheader");
        const body = await this.getSettingValue("signage-group/body");
        const image = await this.getSettingValue("signage-group/main-image");
        const gameMode = this.convertToBoolean(await this.getSettingValue("game-mode"));
        const gameDuration = await this.getSettingValue("game-group/game-duration");
        const gameSummaryScreenDuration = await this.getSettingValue("game-group/game-summary-screen-duration");

        let bodyParagraphs = [];
        if(body) {
            bodyParagraphs = body.split('|');
        }
        if(gameMode) {
            this.window.webContents.send("fromGumband", { type: "game-duration", value: gameDuration });
            this.window.webContents.send("fromGumband", { type: "game-summary-screen-duration", value: gameSummaryScreenDuration });
            this.window.webContents.send("fromGumband", { type: "game-mode" });
            this.sdk.setStatus("screen-status", "Game Screen");
        } else {
            this.window.webContents.send("fromGumband", { type: "stand-by", value: false });
            this.window.webContents.send("fromGumband", { type: "header", value: header });
            this.window.webContents.send("fromGumband", { type: "subheader", value: subheader });
            this.window.webContents.send("fromGumband", { type: "body", value: bodyParagraphs });
            this.window.webContents.send("fromGumband", { type: "main-image", value: image });
            this.sdk.setStatus("screen-status", "Digital Signage");
        }
    }

    async getSettingValue(manifestId) {
        return (await this.sdk.getSetting(manifestId)).value;
    }

    /**
     * Upload the default images included in the repo to the Gumband cloud if they aren't uploaded already.
     */
    async addSeedImages() {
        let currentRemoteFiles = (await this.sdk.content.getRemoteFileList()).files.map(file => file.file);
        fs.readdir(`${__dirname}/seed-images`, (e, files) => {
            files.map((file) => {
                if(!currentRemoteFiles.find(currentFile => currentFile === file)) {
                    let stream = fs.createReadStream(`${__dirname}/seed-images/${file}`)
                    return this.sdk.content.uploadFile(stream);
                };
            });
            setTimeout(async () => {
                this.sdk.content.sync();
            }, 500);
        });

    }

    /**
     * Needed because Gumband toggle settings return their boolean value as a string instead of a boolean.
     * @param {*} string a string that is "true" or "false"
     * @returns boolean
     */
    convertToBoolean(string) {
        return string && string !== "false";
    }
}

module.exports = { GumbandWrapper };
