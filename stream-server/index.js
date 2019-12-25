const ipTool = require('ip');
const path = require('path');
const puppeteer = require('./puppeteer');
const turn = require('../turn-server');

module.exports = (socket) => {
  const ip = socket.handshake.address;
  const token = socket.handshake.query.token;
  const type = ipTool.isPrivate(ip) ? socket.handshake.query.type : 'client';

  if (!token) {
    return socket.disconnect(true);
  }

  let launched = false;
  let browser = null;
  let page = null;

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

    browser = page = null;
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
    page = response.page;

    const queries = {
      host: process.env.HOST,
      port: process.env.PORT,
      secure: process.env.SECURE === 'true' ? 1 : 0,
      token,
      ...turn,
    };

    const search = Object.keys(queries)
      .map((query) => `${query}=${queries[query]}`)
      .join('&');

    await page.goto(`file:${path.join(__dirname, 'index.html')}`);

    page.on('framenavigated', () => {
      socket.emit('navigation', page.mainFrame().url());
    });

    page.evaluate((title) => document.title = title, `e?${search}`);

    launched = true;

    console.log(ip, 'launched', { width, height, scale: deviceScaleFactor, token });

    socket.emit('launched');

    setTimeout(() => {
      page.goto('https://duckduckgo.com');
    }, 500);
  });

  socket.on('navigation', (url) => {
    console.log(ip, 'navigation', url);

    try {
      launched && page.goto(url);
    } catch (e) {
      console.error(ip, 'navigate timeout', url);
    }
  });

  socket.on('mousemove', ({ x, y }) => {
    launched && page.mouse.move(x, y);
  });

  socket.on('mousedown', () => {
    console.log(ip, 'mousedown');

    launched && page.mouse.down();
  });

  socket.on('mouseup', () => {
    console.log(ip, 'mouseup');

    launched && page.mouse.up();
  });

  socket.on('dblclick', ({ x, y }) => {
    console.log(ip, 'dblclick', { x, y });

    launched && page.mouse.click(x, y, { clickCount: 2 });
  });

  socket.on('right-click', ({ x, y }) => {
    console.log(ip, 'right-click', { x, y });

    launched && page.mouse.click(x, y, { button: 'right' });
  });

  socket.on('keydown', (key) => {
    if (!launched || key === 'Dead') {
      return;
    }

    console.log(ip, 'keydown', key);

    page.keyboard.down(key);
  });

  socket.on('keyup', (key) => {
    if (!launched || key === 'Dead') {
      return;
    }

    console.log(ip, 'keyup', key);

    page.keyboard.up(key);
  });

  socket.on('wheel', (delta) => {
    if (!launched) {
      return;
    }

    page.evaluate(({ x, y }) => {
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
