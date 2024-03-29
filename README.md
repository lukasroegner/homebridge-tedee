
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
                    "unlatchFromUnlockedToUnlocked": false,
                    "unlatchLock": false,
                    "disableUnlock": false,
                    "defaultLockName": "Lock",
                    "defaultLatchName": "Latch"
                }
            ],
            "updateInterval": 15,
            "maximumApiRetry": 3
        }
    ]
}
```

**emailAddress**: The email address of your Tedee account.

**password**: The password of your Tedee account.

**devices**: Array of all your devices that the plugin should expose to HomeKit.

**name**: The name of the lock. This name has to match the name that is configured in the Tedee app.

**unlatchFromUnlockedToUnlocked**: If set to `true`, the door is unlatched when you switch from "unlocked" to "unlocked" in the Home app (this move is valid and works in the Home app, just hold down the switch, swipe it to "locked" and then "unlocked" without releasing your finger - do not release the finger until you reached the "unlocked" position again). If set to `false`, nothing is done when you switch from "unlocked" to "unlocked" in the Home app. Only works if the latch is enabled ("pull spring" in the app).

**unlatchLock**: If set to `true`, a second lock switch is exposed for unlatching the smart lock. Only works if the latch is enabled ("pull spring" in the app).

**disableUnlock**: If set to `true`, you cannot unlock via HomeKit, only lock actions are executed.

**defaultLockName** (optional): Lets you customize the name of the lock mechanism. Useful for the Alexa plugin, which does not detect changes of service names in HomeKit. Defaults to `Lock`.

**defaultLatchName** (optional): Lets you customize the name of the unlatch mechanism. Useful for the Alexa plugin, which does not detect changes of service names in HomeKit. Defaults to `Latch`.

**updateInterval**: The interval in seconds at which the lock state is updated from the API. Defaults to `15` seconds.

**maximumApiRetry**: The amount of attempts to call the Tedee API. Useful if you do not want to repeat failed lock/unlock/unlatch attempts after a long timeout delay. Defaults to `3` attempts (incl. initial one).

## Usage

* When you change the HomeKit switch to locked, the smart lock with lock the door.
* When you change the HomeKit switch from locked to unlocked, the smart door will unlock the door. If you have "auto pull spring" enabled in the Tedee app, it will also unlatch.
* When you change the HomeKit switch from unlocked to unlocked, you have the unlatching enabled ("pull spring" in the Tedee app) and the corresponding setting in the `config.json` is enabled (`unlatchFromUnlockedToUnlocked`), then the lock will unlatch.
* If you enabled the second switch for the latch in the `config.json` (`unlatchLock`), you can change the switch to unlocked in order to unlatch the door. This only works if you have unlatching enabled ("pull spring") in the Tedee app.
* Changing the the second switch for the latch to unlocked when the door is locked, nothing is done.

## Thanks

Special thanks to Stephan Düchtel from [SoulAr](https://www.soular.de) for providing a test unit so that the plugin could be developed.
