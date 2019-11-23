const isRoot = require('is-root');
const puppeteer = require('puppeteer');

module.exports = async ({ width, height, token, scale }) => {
  const browser = await puppeteer.launch({
    args: [
      '--auto-select-desktop-capture-source=rbi',
      '--autoplay-policy=no-user-gesture-required',
      '--block-new-web-contents',
      '--disable-gpu',
      // '--kiosk',
      '--no-default-browser-check',
      '--no-recovery-component',
      isRoot() ? '--no-sandbox' : '',
      '--suppress-message-center-popups',
      `--user-data-dir=chrome-user-data/${token}`,
      `--window-size=${width},${height + 93}`,
    ],
    defaultViewport: { width, height, deviceScaleFactor: scale },
    // devtools: true,
    headless: false,
    ignoreDefaultArgs: [
      '--disable-popup-blocking',
      '--enable-automation',
      '--mute-audio',
    ]
  });

  const stream = (await browser.pages())[0];

  const browse = await browser.newPage();

  const client = await browse.target().createCDPSession();

  browse.evaluate(() => document.title = 'rbi');

  browse.setDefaultNavigationTimeout(10 * 1000);

  client.send('Page.setDownloadBehavior', { behavior: 'deny' });

  browser.on('targetcreated', async (target) => {
    (await target.page() || { close: () => {} }).close();
  });

  return {
    browser,
    stream,
    browse,
  };
};
