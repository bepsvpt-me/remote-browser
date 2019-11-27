const isRoot = require('is-root');
const puppeteer = require('puppeteer');
const extension = require('path').join(__dirname, 'extension');

module.exports = async ({ width, height, token, scale }) => {
  const browser = await puppeteer.launch({
    args: [
      '--block-new-web-contents',
      `--disable-extensions-except=${extension}`,
      '--disable-gpu',
      '--kiosk',
      `--load-extension=${extension}`,
      '--no-default-browser-check',
      '--no-recovery-component',
      isRoot() ? '--no-sandbox' : '',
      '--suppress-message-center-popups',
      `--user-data-dir=chrome-user-data/${token}`,
      `--window-size=${width * 2},${height * 2}`,
      '--whitelisted-extension-id=aahdpjnamionemlcfkodembopehdcipg'
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

  const page = (await browser.pages())[0];

  const client = await page.target().createCDPSession();

  page.setDefaultNavigationTimeout(10 * 1000);

  client.send('Page.setDownloadBehavior', { behavior: 'deny' });

  browser.on('targetcreated', async (target) => {
    (await target.page() || { close: () => {} }).close();
  });

  return {
    browser,
    page,
  };
};
