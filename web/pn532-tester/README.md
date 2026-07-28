# PN532 Web Serial Tester

Browser-based PN532 HSU/UART tester used by:

https://www.elechouse.com/pn532-tester/

## Requirements

- Desktop Google Chrome or Microsoft Edge
- HTTPS or localhost
- PN532 configured for HSU/UART mode
- 115200 baud by default

The page can detect the PN532 firmware version, initialize the SAM/RF
configuration, and poll ISO14443A cards.

## Test

Run the protocol and serial-shutdown regression test with Node.js:

```sh
node test-pn532-page.cjs
```

The test covers ACK/response framing, split and coalesced serial data, the HSU
wake-up preamble, initialization commands, and release of the reader lock
before closing the serial port.
