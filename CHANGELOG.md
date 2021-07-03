# v1.0.8

## Enhancements
* removed feature to create DB in case it does not exists
* upgrade of `orientjs` library
* option to set username to database (`dbUsername`) added to config
* option to set password to database (`dbPassword`) added to config 
* default values removed from `sessionsOptions` config option
* default values removed from `connectOptions` config option
* option to set `http Port` added to config
* hapijs stop the server's listener implemented to close OrientDB client instead of using Node signal events listener