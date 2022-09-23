import isRoot from 'is-root'
import path from 'path'
import { fileURLToPath } from 'url'
import puppeteer from 'puppeteer'

const extension = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'extension',
)
const extensionId = 'aahdpjnamionemlcfkodembopehdcipg'
const eventBlacklist = ['page', 'background_page']

const cdp = async (page) => {
  const client = await page.target().createCDPSession()

  client.send('Page.setDownloadBehavior', {
    behavior: 'deny'
  })
}

export default async (options) => {
  const width = 1280

  const height = Math.trunc(width / options.ratio)

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
      isRoot() ? '--no-zygote' : '',
      '--noerrdialogs',
      '--suppress-message-center-popups',
      `--use-gl=${process.env.GPU_GL || 'swiftshader'}`,
      `--user-data-dir=chrome-user-data/${options.token}`,
      `--window-size=${width},${height + 90}`,
      `--whitelisted-extension-id=${extensionId}`,
    ],
    defaultViewport: { width, height },
    executablePath: process.env.CHROMIUM_EXECUTE_PATH || undefined,
    // devtools: true,
    headless: false,
    ignoreDefaultArgs: [
      '--disable-popup-blocking',
      '--enable-automation',
      '--mute-audio',
    ]
  })

  const page = (await browser.pages())[0]

  await page.setViewport({
    width: width,
    height: height,
    deviceScaleFactor: 2,
  })

  cdp(page)

  browser.on('targetcreated', async (target) => {
    if (!eventBlacklist.includes(target.type())) {
      return
    }

    page.goto(target.url())

    (await target.page()).close()
  })

  return { browser, page }
}
