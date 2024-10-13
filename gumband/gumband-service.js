const { Gumband, Sockets } = require("@deeplocal/gumband-node-sdk");
const { manifest, SIGNAGE_GROUP_ID, SIGNAGE_HEADER_ID, SIGNAGE_SUBHEADER_ID, SIGNAGE_BODY_ID, SIGNAGE_MAIN_IMAGE_ID, GAME_MODE_ID, GAME_GROUP_ID, GAME_DURATION_ID, GAME_SUMMARY_SCREEN_DURATION_ID, TOGGLE_GAME_MODE_CONTROL, RELOAD_FRONTEND_CONTROL, SCREEN_STATUS } = require("./manifest");
const { ipcMain } = require("electron");
const fs = require('fs');

const ONE_DAY_IN_MILLISECONDS = 86400000;

/**
 * The length of time in milliseconds that the Hardware LED should blink on when a button in Button Click is clicked.
 * You could even make this into a new, configurable setting!
 */
const HARDWARE_LED_BLINK_TIME = 25;

/**
 * A class that wraps the Gumband SDK and handles websocket messages 
 * that come from the Gumband Cloud.
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
     * The installDate in Epoch time (seconds)
     */
    installDate;
    /**
     * The time interval that should elapse between maintenances in seconds.
     */
    maintenanceInterval;
    /**
     * The number of maintenance reminders that have been triggered since the install date.
     */
    maintenanceNotificationsTriggered;

    constructor(window) {
        this.installDate = parseInt(process.env.INSTALL_DATE);
        this.maintenanceInterval = parseInt(process.env.MAINTENANCE_INTERVAL);
        this.window = window;
        this.gumbandSDK = new Gumband(
            process.env.EXHIBIT_TOKEN,
            process.env.EXHIBIT_ID,
            manifest,
            {
                contentLocation: './electron-app/content',
                useLocalMQTTBroker: true,
            }
        );
        this.addSDKListeners();
        this.addElectronAppListeners();
    }

    addSDKListeners() {
        this.gumbandSDK.on(Sockets.READY, async (manifest) => {
            await this.addSeedImages();
            this.updateFrontendFromSettings();
            this.initializeMaintenanceReminders();
        });
    

        this.gumbandSDK.on(Sockets.SETTING_RECEIVED, (payload) => {
            this.gumbandSDK.logger.info(`${payload.id} setting updated to: ${payload.value}`);
            this.updateFrontendFromSettings();
        });

        this.gumbandSDK.on(Sockets.FILE_UPLOADED, async (manifest) => {
            this.gumbandSDK.content.sync();
        });

        this.gumbandSDK.on(Sockets.CONTROL_RECEIVED, async (payload) => {
            this.gumbandSDK.logger.info(`Control triggered: ${payload.id}`);
            if(payload.id === TOGGLE_GAME_MODE_CONTROL) {
                this.gumbandSDK.setSetting(
                    GAME_MODE_ID, 
                    !(await this.getSettingValue(GAME_MODE_ID))
                );
            } else if (payload.id === RELOAD_FRONTEND_CONTROL) {
                this.window.reload();
                setTimeout(() => {
                    this.updateFrontendFromSettings();
                }, 100);
            }
        });

        this.gumbandSDK.on(Sockets.HARDWARE_PROPERTY_RECEIVED, async (payload) => {
            if(payload.property === "Button/Press" && !payload.value[0]) {
                this.gumbandSDK.setSetting(
                    GAME_MODE_ID, 
                    !(await this.getSettingValue(GAME_MODE_ID))
                );
            }
        });

        this.gumbandSDK.on(Sockets.HARDWARE_FULLY_REGISTERED, (payload) => {
            this.hardwareId = payload.id;
        });
    }

    /**
     * Add listeners for events sent from the Electron App.
     */
    addElectronAppListeners() {
        ipcMain.on("fromElectron", async (event, data) => {
            if (data.type === 'target-hit') {
                this.gumbandSDK.hardware.setProperty(this.hardwareId, 'LED/Toggle', 1);
                setTimeout(() => {
                    this.gumbandSDK.hardware.setProperty(this.hardwareId, 'LED/Toggle', 0);
                }, HARDWARE_LED_BLINK_TIME);
                
                this.gumbandSDK.metrics.create('target-hit');
            }
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
      * Update the electron frontend app with the settings configured in Gumband.
      */
    async updateFrontendFromSettings() {
        const gameMode = await this.getSettingValue(GAME_MODE_ID);
        const header = await this.getSettingValue(`${SIGNAGE_GROUP_ID}/${SIGNAGE_HEADER_ID}`);
        const subheader = await this.getSettingValue(`${SIGNAGE_GROUP_ID}/${SIGNAGE_SUBHEADER_ID}`);
        const body = await this.getSettingValue(`${SIGNAGE_GROUP_ID}/${SIGNAGE_BODY_ID}`);
        const image = await this.getSettingValue(`${SIGNAGE_GROUP_ID}/${SIGNAGE_MAIN_IMAGE_ID}`);

        const gameDuration = await this.getSettingValue(`${GAME_GROUP_ID}/${GAME_DURATION_ID}`);
        const gameSummaryScreenDuration = await this.getSettingValue(`${GAME_GROUP_ID}/${GAME_SUMMARY_SCREEN_DURATION_ID}`);

        //We allow multiple body paragraphs to be defined by using the pipe character as
        //a separator
        let bodyParagraphs = [];
        if(body) {
            bodyParagraphs = body.split('|');
        }
        
        this.window.webContents.send("fromGumband", { type: GAME_MODE_ID, value: gameMode });   
        if(!gameMode) {
            this.window.webContents.send("fromGumband", { type: SIGNAGE_HEADER_ID, value: header });
            this.window.webContents.send("fromGumband", { type: SIGNAGE_SUBHEADER_ID, value: subheader });
            this.window.webContents.send("fromGumband", { type: SIGNAGE_BODY_ID, value: bodyParagraphs });
            this.window.webContents.send("fromGumband", { type: SIGNAGE_MAIN_IMAGE_ID, value: image });
            this.gumbandSDK.setStatus(SCREEN_STATUS, "Digital Signage");
        } else {
            this.window.webContents.send("fromGumband", { type: GAME_DURATION_ID, value: gameDuration });
            this.window.webContents.send("fromGumband", { type: GAME_SUMMARY_SCREEN_DURATION_ID, value: gameSummaryScreenDuration });
            
            //Need to trigger the GAME_MODE_ID update at the end of the game duration updates. This is 
            //because the game duration updates don't trigger a re-render of the frontend, 
            //but the GAME_MODE_ID update does.
            this.window.webContents.send("fromGumband", { type: GAME_MODE_ID, value: gameMode });
            this.gumbandSDK.setStatus(SCREEN_STATUS, "Game Screen");
        }
    }
    
    /**
      * A simple function to get a setting value based on the manifest ID. The manifest
      * ID is a combination of the setting ID and the setting group ID, both of 
      * which are defined in the manifest. You can also log out the manifest in the
      * Sockets.READY event callback.
      */
    async getSettingValue(manifestId) {
        return (await this.gumbandSDK.getSetting(manifestId)).value;
    }
}

module.exports = { GumbandService };