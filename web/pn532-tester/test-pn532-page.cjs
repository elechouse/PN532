// Regression tests for the PN532 Web Serial tester.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert(scriptMatch, 'inline page script was not found');

function createElement() {
  return {
    appendChild() {},
    addEventListener() {},
    classList: { add() {}, remove() {} },
    className: '',
    disabled: false,
    scrollHeight: 0,
    scrollTop: 0,
    textContent: '',
    value: '',
  };
}

const elements = new Map();
const documentStub = {
  createElement,
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, createElement());
    return elements.get(id);
  },
};
documentStub.getElementById('baudRate').value = '115200';
documentStub.getElementById('pollInterval').value = '800';

const navigatorStub = {
  serial: { addEventListener() {} },
  userAgent: 'Mozilla/5.0 Chrome/140.0.0.0',
  userAgentData: { brands: [{ brand: 'Google Chrome' }] },
};
const windowStub = { isSecureContext: true };

const loadPage = new Function(
  'document',
  'navigator',
  'window',
  `${scriptMatch[1]}
   return { ACK_FRAME, COMMANDS, PN532, SerialBuffer, WAKEUP_PREAMBLE, extractAck, extractFrame };`,
);
const {
  ACK_FRAME,
  COMMANDS,
  PN532,
  SerialBuffer,
  WAKEUP_PREAMBLE,
  extractAck,
  extractFrame,
} = loadPage(documentStub, navigatorStub, windowStub);

function makeResponse(body) {
  const len = body.length & 0xff;
  const lcs = (0x100 - len) & 0xff;
  const sum = body.reduce((total, byte) => (total + byte) & 0xff, 0);
  const dcs = (0x100 - sum) & 0xff;
  return [0x00, 0x00, 0xff, len, lcs, ...body, dcs, 0x00];
}

function makeCommand(command, params = []) {
  const body = [0xd4, command, ...params];
  return makeResponse(body);
}

async function testFrameParsing() {
  const firmwareBody = [0xd5, 0x03, 0x32, 0x01, 0x06, 0x07];
  const buffer = [0x99, ...ACK_FRAME, ...makeResponse(firmwareBody)];
  assert.deepEqual(extractAck(buffer), ACK_FRAME);
  assert.deepEqual(extractFrame(buffer), firmwareBody);
  assert.deepEqual(buffer, []);

  const splitBuffer = [0x00, 0x00, 0xff, 0x06];
  assert.equal(extractFrame(splitBuffer), null);
  splitBuffer.push(...makeResponse(firmwareBody).slice(4));
  assert.deepEqual(extractFrame(splitBuffer), firmwareBody);
}

async function testWakeupAndCommands() {
  const writes = [];
  let writerReleased = false;
  const writer = {
    async write(data) { writes.push([...data]); },
    releaseLock() { writerReleased = true; },
  };
  const port = { writable: { getWriter: () => writer } };
  const responses = [
    [0xd5, COMMANDS.GET_FIRMWARE_VERSION + 1, 0x32, 0x01, 0x06, 0x07],
    [0xd5, COMMANDS.SAM_CONFIGURATION + 1],
    [0xd5, COMMANDS.RF_CONFIGURATION + 1],
  ];
  const rx = {
    drain() {},
    async waitForAck() { return ACK_FRAME; },
    async waitForFrame() { return responses.shift(); },
  };
  const device = new PN532(port, rx);

  const firmware = await device.getFirmwareVersion();
  assert.deepEqual(firmware, { ic: 0x32, version: 0x01, revision: 0x06, support: 0x07 });
  assert.deepEqual(
    writes[0],
    [...WAKEUP_PREAMBLE, ...makeCommand(COMMANDS.GET_FIRMWARE_VERSION)],
  );

  await device.initialize();
  assert.deepEqual(
    writes[1],
    [...WAKEUP_PREAMBLE, ...makeCommand(COMMANDS.SAM_CONFIGURATION, [0x01, 0x14, 0x01])],
  );
  assert.equal(
    Buffer.from(writes[1]).toString('hex').toUpperCase(),
    '55550000000000000000000000000000FF05FBD4140114010200',
  );
  assert.deepEqual(
    writes[2],
    makeCommand(COMMANDS.RF_CONFIGURATION, [0x05, 0xff, 0x01, 0x01]),
  );

  await device.release();
  assert.equal(writerReleased, true);
}

async function testReaderShutdown() {
  const events = [];
  let resolveRead;
  const reader = {
    read() {
      events.push('read');
      return new Promise((resolve) => { resolveRead = resolve; });
    },
    async cancel() {
      events.push('cancel');
      resolveRead({ done: true });
    },
    releaseLock() { events.push('releaseLock'); },
  };
  const serialBuffer = new SerialBuffer({ readable: { getReader: () => reader } });
  void serialBuffer.start();
  await serialBuffer.stop();
  assert.deepEqual(events, ['read', 'cancel', 'releaseLock']);
  assert.equal(serialBuffer.reader, null);
}

(async () => {
  await testFrameParsing();
  await testWakeupAndCommands();
  await testReaderShutdown();
  console.log('PN532 page protocol and shutdown tests passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
