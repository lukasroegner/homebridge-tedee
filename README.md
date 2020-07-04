
# Homebridge Tedee Plugin

This project is a homebridge plugin for Tedee smart locks.
The Tedee bridge is required for this plugin to work.

The Tedee smart lock is exposed as a lock in HomeKit with support for:
- Lock/Unlock/Unlatch
- Battery status

Optionally, a second switch is shown in the lock that represents the latch.

## Installation

Please install the plugin with the following command:

```
npm install -g homebridge-tedee
```

## Configuration

```json
{
    "platforms": [
        {
            "platform": "TedeePlatform",
            "emailAddress": "<YOUR-EMAIL-ADDRESS>",
            "password": "<YOUR-PASSWORD>",
            "devices": [
                {
                    "name": "<DEVICE-NAME>",
                    "unlatchFromLockedToUnlocked": false,
                    "unlatchFromUnlockedToUnlocked": false,
                    "unlatchLock": false,
                    "unlatchLockPreventUnlatchIfLocked": false,
                    "defaultLockName": "Lock",
                    "defaultLatchName": "Latch"
                }
            ],
            "updateInterval": 60
        }
    ]
}
```

**emailAddress**: The email address of your Tedee account.

**password**: The password of your Tedee account.

**devices**: Array of all your devices that the plugin should expose to HomeKit.

**name**: The name of the lock. This name has to match the name that is configured in the Tedee app.

**unlatchFromLockedToUnlocked**: If set to `true`, the door is unlatched when you switch from "locked" to "unlocked" in the Home app. If set to `false`, the door is just unlocked when you switch from "locked" to "unlocked" in the Home app.

**unlatchFromUnlockedToUnlocked**: If set to `true`, the door is unlatched when you switch from "unlocked" to "unlocked" in the Home app (this move is valid and works in the Home app, just hold down the switch, swipe it to "locked" and then "unlocked" without releasing your finger - do not release the finger until you reached the "unlocked" position again). If set to `false`, nothing is done when you switch from "unlocked" to "unlocked" in the Home app.

**unlatchLock**: If set to `true`, a second lock switch is exposed for unlatching the smart lock.

**unlatchLockPreventUnlatchIfLocked**: If set to `true`, the second lock (**unlatchLock** has to be `true`) can only operate if the smart lock is unlocked.

**defaultLockName** (optional): Lets you customize the name of the lock mechanism. Useful for the Alexa plugin, which does not detect changes of service names in HomeKit. Defaults to `Lock`.

**defaultLatchName** (optional): Lets you customize the name of the unlatch mechanism. Useful for the Alexa plugin, which does not detect changes of service names in HomeKit. Defaults to `Latch`.

**updateInterval**: The interval in seconds at which the lock state is updated from the API. Defaults to `60` seconds.
