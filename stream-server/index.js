const credentials = require('../credentials');
const ipTool = require('ip');
const path = require('path');
const puppeteer = require('./puppeteer');

module.exports = (socket) => {
  const ip = socket.handshake.address;
  const token = socket.handshake.query.token;
  const type = ipTool.isPrivate(ip) ? socket.handshake.query.type : 'client';

  if (!token) {
    return socket.disconnect(true);
  }

  let launched = false;
  let browser = null;
  let stream = null;
  let browse = null;

  socket.join(token);

  socket.on('disconnect', () => {
    if (type === 'server' || !browser) {
      return;
    }

    console.log(ip, 'disconnect');

    launched = false;

    socket.removeAllListeners();

    socket.leave(token);

    browser.close();

    browser = stream = browse = null;
  });

  socket.on('launch', async ({ width, height, deviceScaleFactor }) => {
    if (browser) {
      return socket.emit('running');
    }

    const response = await puppeteer({
      width,
      height,
      scale: deviceScaleFactor,
      token,
    });

    browser = response.browser;
    stream = response.stream;
    browse = response.browse;

    const queries = {
      host: process.env.HOST,
      port: process.env.PORT,
      secure: process.env.SECURE === 'true' ? 1 : 0,
      token,
      ...credentials,
    };

    const search = Object.keys(queries)
      .map((query) => `${query}=${queries[query]}`)
      .join('&');

    await stream.bringToFront();

    await stream.goto('file:' + path.join(__dirname, `stream.html?${search}`));

    browse.on('framenavigated', () => {
      socket.emit('navigation', browse.mainFrame().url());
    });

    browse.goto('https://duckduckgo.com');

    launched = true;

    console.log(ip, 'launched', { width, height, scale: deviceScaleFactor, token });

    socket.emit('launched');
  });

  socket.on('navigation', (url) => {
    console.log(ip, 'navigation', url);

    try {
      launched && browse.goto(url);
    } catch (e) {
      console.error(ip, 'navigate timeout', url);
    }
  });

  socket.on('mousemove', ({ x, y }) => {
    launched && browse.mouse.move(x, y);
  });

  socket.on('mousedown', () => {
    console.log(ip, 'mousedown');

    launched && browse.mouse.down();
  });

  socket.on('mouseup', () => {
    console.log(ip, 'mouseup');

    launched && browse.mouse.up();
  });

  socket.on('dblclick', ({ x, y }) => {
    console.log(ip, 'dblclick', { x, y });

    launched && browse.mouse.click(x, y, { clickCount: 2 });
  });

  socket.on('right-click', ({ x, y }) => {
    console.log(ip, 'right-click', { x, y });

    launched && browse.mouse.click(x, y, { button: 'right' });
  });

  socket.on('keydown', (key) => {
    if (!launched || key === 'Dead') {
      return;
    }

    console.log(ip, 'keydown', key);

    browse.keyboard.down(key);
  });

  socket.on('keyup', (key) => {
    if (!launched || key === 'Dead') {
      return;
    }

    console.log(ip, 'keyup', key);

    browse.keyboard.up(key);
  });

  socket.on('wheel', (delta) => {
    if (!launched) {
      return;
    }

    browse.evaluate(({ x, y }) => {
      window.scrollTo(
        window.scrollX + x,
        window.scrollY + y
      );
    }, delta);
  });

  ['offer', 'answer', 'candidate'].forEach((handshake) => {
    socket.on(handshake, (data) => {
      console.log(ip, handshake);

      socket.to(token).emit(handshake, data);
    });
  });
};
