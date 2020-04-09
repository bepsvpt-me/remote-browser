const isRoot = require('is-root');
const path = require('path');
const pick = require('lodash/pick');
const puppeteer = require('puppeteer');
const extension = path.join(__dirname, 'extension');
const extensionId = 'aahdpjnamionemlcfkodembopehdcipg';
const eventBlacklist = ['page', 'background_page'];

const cdp = async (page) => {
  const client = await page.target().createCDPSession();

  client.send('Page.setDownloadBehavior', {
    behavior: 'deny'
  });
};

module.exports = async (options) => {
  const width = 1280;

  const height = Math.trunc(width / options.ratio);

  const browser = await puppeteer.launch({
    args: [
      '--block-new-web-contents',
      '--disable-breakpad',
      '--disable-dev-shm-usage',
      `--disable-extensions-except=${extension}`,
      '--kiosk',
      `--load-extension=${extension}`,
      '--no-crash-upload',
      '--no-default-browser-check',
      '--no-first-run',
      '--no-managed-user-acknowledgment-check',
      '--no-recovery-component',
      isRoot() ? '--no-sandbox' : '',
      '--no-zygote',
      '--noerrdialogs',
      '--suppress-message-center-popups',
      `--use-gl=${process.env.GPU_GL}`,
      `--user-data-dir=chrome-user-data/${options.token}`,
      `--window-size=${width},${height + 90}`,
      `--whitelisted-extension-id=${extensionId}`,
    ],
    defaultViewport: { width, height },
    // devtools: true,
    headless: false,
    ignoreDefaultArgs: [
      '--disable-popup-blocking',
      '--enable-automation',
      '--mute-audio',
    ]
  });

  const page = (await browser.pages())[0];

  cdp(page);

  browser.on('targetcreated', async (target) => {
    if (!eventBlacklist.includes(target.type())) {
      return;
    }

    page.goto(target.url());

    (await target.page()).close();
  });

  return { browser, page };
};
