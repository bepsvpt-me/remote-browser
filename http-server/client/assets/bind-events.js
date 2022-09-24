const offsetY = 38
const ratio = 1280 / document.querySelector('div.stream').clientWidth

const bindEvents = (socket) => {
  const coordinate = (e) => {
    return {
      x: Math.trunc(e.clientX * ratio),
      y: Math.trunc((e.clientY - offsetY) * ratio),
    }
  }

  const composition = (target) => {
    socket.emit('composition', {
      text: target.value,
      selectionStart: target.selectionStart,
      selectionEnd: target.selectionEnd,
      selectionDirection: target.selectionDirection,
    })
  }

  const stream = document.querySelector('div.stream')

  // mouse event

  stream.addEventListener('mousemove', (e) => {
    socket.emit('mousemove', coordinate(e))
  })

  stream.addEventListener('mousedown', () => {
    socket.emit('mousedown')
  })

  stream.addEventListener('mouseup', () => {
    socket.emit('mouseup')
  })

  stream.addEventListener('dblclick', (e) => {
    socket.emit('dblclick', coordinate(e))
  })

  stream.addEventListener('contextmenu', (e) => {
    e.preventDefault()

    socket.emit('right-click', coordinate(e))
  })

  // keyboard event

  document.addEventListener('keydown', (e) => {
    const target = e.target

    if (target === url) {
      return
    } else if (target === input) {
      if (e.key !== 'Process' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        window.setTimeout(
          () => window.requestAnimationFrame(
            () => composition(target)
          ),
          5
        )
      }

      return
    } else if (['Backspace'].includes(e.key)) {
      e.preventDefault()
    }

    socket.emit('keydown', e.key)
  })

  document.addEventListener('keyup', (e) => {
    const target = e.target

    if (target === url) {
      return
    } else if (target === input) {
      return
    } else if (['Backspace'].includes(e.key)) {
      e.preventDefault()
    }

    socket.emit('keyup', e.key)
  })

  input.addEventListener('compositionupdate', (e) => {
    window.requestAnimationFrame(() => composition(e.target))
  })

  input.addEventListener('compositionend', (e) => {
    window.requestAnimationFrame(() => composition(e.target))
  })

  // wheel event

  document.addEventListener('wheel', (e) => {
    e.preventDefault()

    socket.emit('wheel', {
      x: e.deltaX,
      y: e.deltaY,
      z: e.deltaZ,
      mode: e.deltaMode,
    })
  }, {
    passive: false
  })
}
