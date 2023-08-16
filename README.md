# Gumband SDK Demo #
This demo project represents an arbitrary exhibit build to demo how Gumband is used and could be integrated for your next project. This demo is an Electron app that can function as digital signage or as a simple, interactable game. 

The repo has two main parts: an Electron app and a Gumband integration via the [Gumband SDK](https://www.npmjs.com/package/@deeplocal/gumband-node-sdk). The Gumband integration is the important part, since the Electron app is simply meant to stand in as any third party integration that can communicate through TCP or some other communication protocol. This repo demonstrates how to:
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

After a few seconds, stop the Electron app and run `npm run start` again. This is only necessary because of [an existing bug](https://deeplocal.atlassian.net/browse/GUM-932) related to default setting values.

### Enabling the Gumband Hardware Integration (Optional) ###
To enable the Gumband Hardware for this demo: 
- Follow the [Hardware Getting Started Guide](https://deeplocal.atlassian.net/wiki/spaces/GS/pages/37617673/Hardware+Getting+Started+Guide) to set up the Gumband Hardware and your development environment. Set up your hardware under the same site in the Gumband UI as this demo exhibit.
- In the Arduino IDE, open the `SendButtonPresses` firmware example by navigating to File -> Examples -> Gumband API -> SendButtonPresses and flash it onto your Gumband Hardware.
- Add `EXHIBIT_GBTT_PORT` as an environment variable to the `.env` file. This can be any port available on your machine, and will be the MQTT port through which the hardware will communicate with the exhibit directly.
- Connect the Hardware instance in the Gumband UI to the Demo exhibit. You can do this through the Hardware overview tab.
- Add the `${IP}:${EXHIBIT_GBTT_PORT}` in the `MQTT IP Address` field under the Demo exhibit Hardware tab in the Gumband UI. The IP should be the IP address of the machine running the exhibit. This is how the Hardware knows where to communicate with the exhibit MQTT service.
- The hardware should now be online and connected to the exhibit, and pressing the button next to the ethernet port should toggle the game mode for the exhibit.

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

#### Custom Email Notifications
- Send a maintenance email notification every 6 months from the date of the install.

#### Gumband Hardware Integration ####
- Pressing the button on the Gumband Hardware toggles the Game Mode setting.
- Clicking a button target in the Button Clicker game blinks the Gumband Hardware LED.
