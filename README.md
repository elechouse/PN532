## NFC library for Arduino

This is an Arduino library for PN532 to use NFC technology. It's based on 
[Adafruit_NFCShield_I2C](http://goo.gl/pk3FdB)
, improved by [Seeed Studio](http://goo.gl/zh1iQh), added HSU(High Speed Uart) driver by [Elechouse](http://elechouse.com). 

It works with:

+ [Elechouse NFC Module](http://goo.gl/i0EQgd)
+ [Seeed Studio NFC Shield](http://goo.gl/Cac2OH)
+ [Xadow NFC](http://goo.gl/qBZMt0)
+ [Adafruit PN532 NFC/RFID controller breakout board](http://goo.gl/tby9Sw)

### Features
+ Support all interfaces of PN532 (I2C, SPI, HSU )
+ Read/write Mifare Classic Card
+ Works with [Don's NDEF Library](http://goo.gl/jDjsXl)
+ Support Peer to Peer communication(exchange data with android 4.0+)
+ Support [mbed platform](http://goo.gl/kGPovZ)

### Getting Started
1. **Download [zip file](https://github.com/elechouse/PN532/archive/PN532_HSU.zip) and 
extract the four folders(PN532, PN532_SPI, PN532_HSU and PN532_I2C) into libraries of Arduino.**
2. Downlaod [Don's NDEF library](http://goo.gl/ewxeAe) and extract it intro Arduino's libraries.
2. Follow the examples of the library

### To do
+ Card emulation

## HSU Interface

HSU is short for High Speed Uart. HSU interface needs only 4 wires to connect PN532 with Arduino, [Sensor Shield](http://goo.gl/i0EQgd) can make it more easier. For some Arduino boards like [Leonardo][Leonardo], [DUE][DUE], [Mega][Mega] ect, there are more than one `Serial` on these boards, so we can use this additional Serial to control PN532, HSU uses 115200 baud rate .

To use the `Serial1` control PN532, refer to the code below.

	#include <PN532_HSU.h>
	#include <PN532.h>
	
	PN532_HSU pn532hsu(Serial1);
	PN532 nfc(pn532hsu);

	void setup(void)
	{
		nfc.begin();
		//...
	}


[Mega]: http://arduino.cc/en/Main/arduinoBoardMega
[DUE]: http://arduino.cc/en/Main/arduinoBoardDue
[Leonardo]: http://arduino.cc/en/Main/arduinoBoardLeonardo

