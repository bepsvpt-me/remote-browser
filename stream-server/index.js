const ice = require('../ice-servers');
const ipTool = require('ip');
const puppeteer = require('./puppeteer');
const typeWhitelist = ['server', 'client'];
const handshakes = ['offer', 'answer', 'candidate'];

module.exports = (socket) => {
  const { token, type } = socket.handshake.query;
  const ip = socket.handshake.address;

  if (!token || !type || !typeWhitelist.includes(type)) {
    return socket.disconnect(true);
  } else if (!ipTool.isPrivate(ip) && type === 'server') {
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

  socket.on('launch', async (options) => {
    if (browser) {
      return socket.emit('running');
    }

    const config = JSON.stringify({
      ice: ice(),
      socket: `http://${process.env.HOST}:${process.env.PORT}`,
      token,
    });

    const response = await puppeteer({ token, ...options });

    launched = true;

    browser = response.browser;
    page = response.page;

    page.evaluate(title => document.title = title, config)

    console.log(ip, 'launched', { token, ...options });
  });

  socket.on('launched', async () => {
    if (type === 'server') {
      return socket.to(token).emit('launched');
    }

    page.on('framenavigated', () => {
      socket.emit('navigation', page.mainFrame().url());
    });

    page.goto('https://duckduckgo.com');
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

  // fix element scroll
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

  handshakes.forEach((handshake) => {
    socket.on(handshake, (data) => {
      console.log(ip, handshake);

      socket.to(token).emit(handshake, data);
    });
  });
};
