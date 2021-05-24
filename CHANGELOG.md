# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2021-05-24
### Changes
- Reverting changes of 0.3.0 and 0.3.1 as the additional configuration does not work with Tedee
- Enhanced the documentation
- Updated to the latest API version
- Integrated the "sync" mechanism that has been introduced to the API: rather than getting all lock information when updating the data from the API, only the lock states are loaded
- Integrated the "operation" mechanism that has been introduced to the API: the state of an operation (close, open, pull-spring) can be checked (e.g. whether it is pending or completed). This leads to fewer API "update" calls after an operation is performed by the user
- Tested the features of the plugin with the latest API version and the latest firmware updates
- Reduced the default update interval to 15 seconds. The documentation of the API states that at most one call every 10 seconds can be made to update the state of the lock(s)
- Updated the dependencies

## [0.3.1] - 2021-05-18
### Changes
- Bugfix for unlatching from unlocked state

## [0.3.0] - 2021-05-18
### Changes
- Added additional option to unlatch the door when switching from locked to unlocked

## [0.2.1] - 2020-12-05
### Changes
- Updated to use the latest API version v1.15

## [0.2.0] - 2020-07-14
### Changes
- Added an option to disable unlocking via HomeKit.

## [0.1.3] - 2020-07-12
### Changes
- Fixed the latch when lock is in half-closed state.

## [0.1.2] - 2020-07-12
### Changes
- Half-closed state now maps to UNSECURED in HomeKit.

## [0.1.1] - 2020-07-04
### Changes
- Fixed an issue in the config schema.

## [0.1.0] - 2020-07-04
### Changes
- Initial implementation of the plugin.
