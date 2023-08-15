const { Gumband, Sockets } = require("@deeplocal/gumband-node-sdk");
const fs = require('fs');
const { ipcMain } = require("electron");

const ONE_DAY_IN_MILLISECONDS = 86400000;

//these could be environment variables
const SIX_MONTHS_IN_SECONDS = 15770000;
const EPOCH_TIME_FOR_AUGUST_15_2023 = 1692121575;

/**
 * A class that wraps the Gumband SDK and handles websocket messages that come from the Gumband Cloud.
 */
class GumbandService {
    /**
     * A reference to the window object of the Electron app frontend.
     */
    window;
    /**
     * A reference to the Gumband SDK instance.
     */
    gumbandSDK;
    /**
     * Whether the exhibit is in operation mode. Configured in the Gumband UI.
     */
    opMode;

    constructor(window) {
        this.window = window;
        this.installDate = EPOCH_TIME_FOR_AUGUST_15_2023;
        this.maintenanceInterval = SIX_MONTHS_IN_SECONDS;

        this.gumbandSDK = new Gumband(
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
        this.gumbandSDK.on(Sockets.READY, async (manifest) => {
            this.opMode = manifest.opMode === "On";
            await this.addSeedImages();
            this.setFrontendOperationMode();
            this.updateFrontendFromSettings();

            this.initializeMaintenanceReminders();
        });

        this.gumbandSDK.on(Sockets.OP_MODE_RECEIVED, (payload) => {
            this.opMode = payload.value;
            this.setFrontendOperationMode();
            this.updateFrontendFromSettings();
            this.gumbandSDK.logger.info(`OP_MODE changed to: ${payload.value}`);
        });

        this.gumbandSDK.on(Sockets.SETTING_RECEIVED, (payload) => {
            this.gumbandSDK.logger.info(`${payload.id} setting updated to: ${payload.value}`);

            this.updateFrontendFromSettings();
        });

        this.gumbandSDK.on(Sockets.CONTROL_RECEIVED, async (payload) => {
            this.gumbandSDK.logger.info(`Control triggered: ${payload.id}`);
            
            if(payload.id === "toggle-game-mode") {
                this.gumbandSDK.setSetting(
                    "game-mode", 
                    !this.convertToBoolean(
                        (await this.getSettingValue("game-mode"))
                    )
                );
            } else if (payload.id === "reload-frontend") {        
                this.window.reload();
                setTimeout(() => {
                    this.updateFrontendFromSettings();
                }, 100);
            }
        });

        this.gumbandSDK.on(Sockets.HARDWARE_PROPERTY_RECEIVED, async (payload) => {
            if(payload.peripheral === "Button" && payload.value === 0) {
                this.gumbandSDK.setSetting(
                    "game-mode", 
                    !this.convertToBoolean(
                        (await this.getSettingValue("game-mode"))
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
                this.gumbandSDK.event.create("game-completed", { 
                    "targets-clicked": data.value,
                    "game-duration": await this.getSettingValue("game-group/game-duration")
                });
                this.gumbandSDK.setStatus("last-game-played", new Date().toString());
            }
        });
    }

    /**
     * Set the electron frontend app to standby mode.
     */
    setFrontendOperationMode() {
        this.window.webContents.send("fromGumband", { type: "operation-mode", value: this.opMode });
        if(!this.opMode) {
            this.gumbandSDK.setStatus("screen-status", "Standby Screen");
        }
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
        if(!gameMode) {
            this.window.webContents.send("fromGumband", { type: "game-mode", value: gameMode });
            this.window.webContents.send("fromGumband", { type: "header", value: header });
            this.window.webContents.send("fromGumband", { type: "subheader", value: subheader });
            this.window.webContents.send("fromGumband", { type: "body", value: bodyParagraphs });
            this.window.webContents.send("fromGumband", { type: "main-image", value: image });
            this.gumbandSDK.setStatus("screen-status", "Digital Signage");
        } else {
            this.window.webContents.send("fromGumband", { type: "game-duration", value: gameDuration });
            this.window.webContents.send("fromGumband", { type: "game-summary-screen-duration", value: gameSummaryScreenDuration });
            this.window.webContents.send("fromGumband", { type: "game-mode", value: gameMode });
            this.gumbandSDK.setStatus("screen-status", "Game Screen");
        }
    }

    async getSettingValue(manifestId) {
        return (await this.gumbandSDK.getSetting(manifestId)).value;
    }

    /**
     * Upload the default images included in the repo to the Gumband cloud if they aren't uploaded already.
     */
    async addSeedImages() {
        let currentRemoteFiles = (await this.gumbandSDK.content.getRemoteFileList()).files.map(file => file.file);
        fs.readdir(`${__dirname}/../seed-images`, async (e, files) => {
            let fileUploadPromises = files.map((file) => {
                if(!currentRemoteFiles.find(currentFile => currentFile === file)) {
                    let stream = fs.createReadStream(`${__dirname}/../seed-images/${file}`)
                    return this.gumbandSDK.content.uploadFile(stream);
                };
            });

            await Promise.all(fileUploadPromises);
            this.gumbandSDK.content.sync();
        });
    }


    /**
     * Initializes a time interval that runs every day to check if a new maintenance reminder should be sent.
     */
    initializeMaintenanceReminders() {
        this.maintenanceNotificationsTriggered = this.getMaintenanceIntervalsSinceInstall();
        setInterval(async () => {
            if(this.maintenanceNotificationsTriggered < this.getMaintenanceIntervalsSinceInstall()) {
                this.gumbandSDK.notifications.email('This is a maintenance reminder');
                this.maintenanceNotificationsTriggered++;
            }
        }, ONE_DAY_IN_MILLISECONDS);
    }

    /**
     * Returns the number of maintenances that should have occurred since initial installation.
     * @returns The number of maintenances that should have occurred since install
     */
    getMaintenanceIntervalsSinceInstall() {
        return Math.floor((Math.floor(new Date().getTime() / 1000) - this.installDate) / this.maintenanceInterval);
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

module.exports = { GumbandService };
