const SCREEN_STATUS = "screen-status";

const RELOAD_FRONTEND_CONTROL = "reload-frontend";
const TOGGLE_GAME_MODE_CONTROL = "toggle-game-mode";

const SIGNAGE_GROUP_ID = "signage-group";
const SIGNAGE_HEADER_ID = "header";
const SIGNAGE_SUBHEADER_ID = "subheader";
const SIGNAGE_BODY_ID = "body";
const SIGNAGE_MAIN_IMAGE_ID = "main-image";

const GAME_MODE_ID = "game-mode";

const GAME_GROUP_ID = "game-group";
const GAME_DURATION_ID = "game-duration";
const GAME_SUMMARY_SCREEN_DURATION_ID = "game-summary-screen-duration";

const manifest = {
    manifest: {
        statuses: [
            {
                id: SCREEN_STATUS,
                type: "String",
                display: "Screen is currently showing:",
                order: 0
            }
        ],
        controls: [
            {
                id: RELOAD_FRONTEND_CONTROL,
                type: "Single",
                display: "Reload Frontend",
                order: 0
              },
              {
                id: TOGGLE_GAME_MODE_CONTROL,
                type: "Single",
                display: "Toggle Game Mode",
                order: 1
              }
        ],
        settings: [
            {
                id: SIGNAGE_GROUP_ID,
                type: "SettingsGroup",
                display: "Digital Signage Settings",
                order: 0,
                schema: [
                    {
                        id: SIGNAGE_HEADER_ID,
                        type: "TextInput",
                        display: "Header Copy",
                        order: 0
                    },
                    {
                        id: SIGNAGE_SUBHEADER_ID,
                        type: "TextInput",
                        display: "Subheader Copy",
                        order: 1
                    },
                    {
                        id: SIGNAGE_BODY_ID,
                        type: "TextInput",
                        display: "Body Copy (separate by | for new paragraph)",
                        order: 2
                    },
                    {
                        id: SIGNAGE_MAIN_IMAGE_ID,
                        type: "FileSelection",
                        display: "Image Asset",
                        order: 3
                    }
                ]
            },
            {
                id: GAME_MODE_ID,
                type: "Toggle",
                display: "Game Mode",
                order: 1
            },
            {
                id: GAME_GROUP_ID,
                type: "SettingsGroup",
                display: "Game Settings",
                order: 2,
                schema: [
                    {
                        id: GAME_DURATION_ID,
                        type: "IntegerInput",
                        display: "Game Duration (seconds)",
                        default: "5",
                        order: 0
                    },
                    {
                        id: GAME_SUMMARY_SCREEN_DURATION_ID,
                        type: "IntegerInput",
                        display: "Game Summary Screen Duration (seconds)",
                        default: "5",
                        order: 1
                    }
                ]
            }
        ]
    }
}

module.exports = { 
    manifest,
    SCREEN_STATUS,
    RELOAD_FRONTEND_CONTROL,
    TOGGLE_GAME_MODE_CONTROL,
    SIGNAGE_GROUP_ID,
    SIGNAGE_HEADER_ID,
    SIGNAGE_SUBHEADER_ID,
    SIGNAGE_BODY_ID,
    SIGNAGE_MAIN_IMAGE_ID,
    GAME_MODE_ID,
    GAME_GROUP_ID,
    GAME_DURATION_ID,
    GAME_SUMMARY_SCREEN_DURATION_ID,
};