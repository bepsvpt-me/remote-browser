import ipTool from 'ip'
import puppeteer from './puppeteer/index.js'

const typeWhitelist = ['server', 'client']
const handshakes = ['offer', 'answer', 'candidate']

export default (socket) => {
  const { token, type } = socket.handshake.query
  const ip = socket.handshake.address

  if (!token || !type || !typeWhitelist.includes(type)) {
    return socket.disconnect(true)
  } else if (!ipTool.isPrivate(ip) && type === 'server') {
    return socket.disconnect(true)
  }

  let launched = false
  let browser = null
  let page = null

  socket.join(token)

  socket.on('disconnect', () => {
    if (type === 'server' || !browser) {
      return
    }

    console.log(ip, 'disconnect')

    launched = false

    socket.removeAllListeners()

    socket.leave(token)

    browser.close()

    browser = page = null
  })

  socket.on('launch', async (options) => {
    if (browser) {
      return socket.emit('running')
    }

    const config = JSON.stringify({
      ice: (await import('../ice-servers/index.js')).default(),
      socket: `http://${process.env.HOST}:${process.env.PORT}`,
      token,
    })

    const response = await puppeteer({ token, ...options })

    launched = true

    browser = response.browser
    page = response.page

    page.evaluate(title => document.title = title, config)

    console.log(ip, 'launched', { token, ...options })
  })

  socket.on('launched', async () => {
    if (type === 'server') {
      return socket.to(token).emit('launched')
    }

    page.on('domcontentloaded', async () => {
      socket.emit('navigation', {
        url: page.url(),
        title: await page.title(),
      })

      page.evaluate(() => {
        const leave = `[remote-browser] ${JSON.stringify({ event: 'focusout' })}`

        window.addEventListener('focusin', (event) => {
          const el = event.target

          if (!['input', 'textarea'].includes(el.tagName.toLowerCase())) {
            return
          }

          const { top, left } = el.getBoundingClientRect()
          const style = window.getComputedStyle(el)

          window.requestAnimationFrame(() => {
            const payload = JSON.stringify({
              event: 'focusin',
              left: `(${left}px + ${style.paddingLeft})`,
              top: `(${top}px + ${style.paddingTop})`,
              width: `(${el.clientWidth}px - ${style.paddingLeft} - ${style.paddingRight})`,
              height: `(${el.clientHeight}px - ${style.paddingTop} - ${style.paddingBottom})`,
              fontSize: style.fontSize,
              cursor: el.selectionStart,
              value: el.value,
            })

            console.log(`[remote-browser] ${payload}`)
          })
        })

        window.addEventListener('focusout', () => console.log(leave))

        window.addEventListener('beforeunload', () => console.log(leave));
      })
    })

    page.on('console', (cm) => {
      const keyword = '[remote-browser] '
      const msg = cm.text()

      if (!msg.startsWith(keyword)) {
        return
      }

      console.log(ip, 'console', msg)

      const data = JSON.parse(msg.substring(keyword.length))

      socket.emit(data.event, data)
    })

    page.goto('https://www.google.com/')
  })

  socket.on('navigation', (url) => {
    console.log(ip, 'navigation', url)

    try {
      launched && page.goto(url)
    } catch (e) {
      console.error(ip, 'navigate timeout', url)
    }
  })

  socket.on('mousemove', ({ x, y }) => {
    launched && page.mouse.move(x, y)
  })

  socket.on('mousedown', () => {
    console.log(ip, 'mousedown')

    launched && page.mouse.down()
  })

  socket.on('mouseup', () => {
    console.log(ip, 'mouseup')

    launched && page.mouse.up()
  })

  socket.on('dblclick', ({ x, y }) => {
    console.log(ip, 'dblclick', { x, y })

    launched && page.mouse.click(x, y, { clickCount: 2 })
  })

  socket.on('right-click', ({ x, y }) => {
    console.log(ip, 'right-click', { x, y })

    launched && page.mouse.click(x, y, { button: 'right' })
  })

  socket.on('keydown', (key) => {
    if (!launched || key === 'Dead') {
      return
    }

    console.log(ip, 'keydown', key)

    page.keyboard.down(key)
  })

  socket.on('keyup', (key) => {
    if (!launched || key === 'Dead') {
      return
    }

    console.log(ip, 'keyup', key)

    page.keyboard.up(key)
  })

  socket.on('composition', (data) => {
    if (!launched) {
      return
    }

    console.log(ip, 'composition', data)

    page.evaluate(({ text, selectionStart, selectionEnd, selectionDirection }) => {
      const el = document.activeElement

      if (!['input', 'textarea'].includes(el.tagName.toLowerCase())) {
        return
      }

      el.value = text
      el.setSelectionRange(selectionStart, selectionEnd, selectionDirection)
    }, data)
  })

  socket.on('wheel', (delta) => {
    if (!launched) {
      return
    }

    page.mouse.wheel({
      deltaX: delta.x,
      deltaY: delta.y,
    })
  })

  handshakes.forEach((handshake) => {
    socket.on(handshake, (data) => {
      console.log(ip, handshake)

      socket.to(token).emit(handshake, data)
    })
  })
}
