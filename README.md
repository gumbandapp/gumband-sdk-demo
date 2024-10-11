# Gumband SDK Demo #
This demo project represents an arbitrary exhibit build to demo how Gumband is used and could be integrated for your next project. This demo is an Electron app that can function as digital signage or as a simple, interactable game. 

The repo has two main parts: an Electron app and a Gumband integration via the [Gumband SDK](https://www.npmjs.com/package/@deeplocal/gumband-node-sdk). The Gumband integration is the important part, since the Electron app is simply meant to stand in as any third party integration that can communicate through TCP or some other communication protocol. This repo demonstrates how to integrate Gumband into you exhibit to:
- Use statuses as health checks.
- Use controls to trigger one-time events.
- Use settings to add configurations.
- Send logs to Gumband to assist in debugging.
- Send reporting events to Gumband to capture user interactions.
- Integrate with a Gumband Hardware.
- Send notification emails when a custom condition is met.

## Getting Started ##

Create an exhibit in the Gumband UI (app.gumband.com), and generate an exhibit ID and AUTH TOKEN in the Gumband UI. For more details, see the [Gumband docs](https://deeplocal.atlassian.net/wiki/spaces/GS/pages/2261035/Gumband+Web+UI#%5BinlineExtension%5DCreate-a-New-Exhibit).

Create a `.env` file in the root of this repo, and copy the ID and AUTH TOKEN into it as EXHIBIT_TOKEN and EXHIBIT_ID. See the .example-env for an example.

Run `npm install` to install dependencies.

Run `npm run start` to launch the Electron app and connect to Gumband.

After a few seconds, stop the Electron app and run `npm run start` again. This is only necessary because of [an existing bug](https://deeplocal.atlassian.net/browse/GUM-932) related to default setting values.

### Enabling the Gumband Hardware Integration (Optional) ###
To enable the Gumband Hardware for this demo: 
- All of the implementation of code for the hardware integration is already complete in this repo, but you can follow the steps outlined in the [Gumband Tutorial](https://deeplocal.atlassian.net/wiki/spaces/GS/pages/196149318/Tutorial+Digital+Signage+and+Game#Connecting-Your-Hardware-to-the-SDK) to configure your hardware to know how to communicate with the MQTT broker this demo is running.

## Gumband Integrations in this Demo:

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

#### Reporting Analytics ####
- When a user first clicks a target, an interaction will be started. The interaction won't end until 60 seconds passes without any target clicks.

#### Custom Email Notifications
- Send a maintenance email notification every 6 months from the date of the install.

#### Gumband Hardware Integration ####
- Pressing the button on the Gumband Hardware toggles the Game Mode setting.
- Clicking a button target in the Button Clicker game blinks the Gumband Hardware LED.
