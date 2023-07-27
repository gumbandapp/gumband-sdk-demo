# Gumband SDK Demo #
This demo project represents an arbitrary exhibit build to demo how Gumband is used and could be integrated for your next project. The repo has two main parts: an Electron app and a Gumband integration via the [Gumband SDK](https://www.npmjs.com/package/@deeplocal/gumband-node-sdk). The Gumband integration is the important part, since the Electron app is simply meant to stand in as any third party integration that can communicate through TCP or some other communication protocol. This repo demonstrates how to:
- Use statuses as health checks for your exhibits.
- Use controls to trigger one-time events in your exhibits.
- Use settings to add configurations to your exhibits.
- Send logs to Gumband to assist in debugging.
- Send reporting events to Gumband to capture user interactions.

## Getting Started ##

Create an exhibit in the Gumband UI (app.gumband.com), and generate an exhibit ID and AUTH TOKEN in the Gumband UI. For more details, see the [Gumband docs](https://deeplocal.atlassian.net/wiki/spaces/GS/pages/2261035/Gumband+Web+UI#%5BinlineExtension%5DCreate-a-New-Exhibit).

Create a `.env` file in the root of this repo, and copy the ID and AUTH TOKEN into it as EXHIBIT_TOKEN and EXHIBIT_ID. E.g:

```
EXHIBIT_TOKEN=b14c73f75f2cdd7be7da06299a5b4e6d
EXHIBIT_ID=1
```

Run `npm install` to install dependencies.

Run `npm run start` to launch the Electron app and connect to Gumband.

## Gumband Integrations in this Demo:

#### Operation Mode ####
- Toggles the screen between an active state and a standby mode.

#### Statuses ####
- "Screen is currently showing:" - indicates the screen that is currently being shown.
- "Last game played:" - the date and time when the last game was completed.

#### Controls ####
- Reload Frontend - Reloads the HTML of the Electron app with the latest Gumband Settings.
- Toggle Game Mode - Toggles the screen between the Digital Signage and Game Modes.

#### Settings ####
- Header Copy - The copy text for the header of the Digital Signage.
- Subheader Copy - The copy text for the subheader of the Digital Signage.
- Body Copy - The copy text for the body of the Digital Signage.
- Image Asset - The image shown on the Digital Signage.
- Game Duration - The duration of each game in seconds.
- Game Summary Screen Duration - The duration of how long the game summary screen shows after a game is completed.
- Game Mode - Whether the game or the digital signage is showing.

#### Logs ####
- When the operation mode changes.
- When any setting is changed in Gumband.
- When any control is triggered in Gumband.

#### Reporting Events ####
- When a game is completed.