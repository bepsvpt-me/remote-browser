const getTab = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => chrome.tabs.get(id, resolve), 20)
  })
}

const getInfo = {
  populate: true
}

const captureOptions = ({ width, height }) => {
  return {
    audio: true,
    video: true,
    videoConstraints: {
      mandatory: {
        maxWidth: width * 2,
        minWidth: width * 2,
        maxHeight: height * 2,
        minHeight: height * 2,
        maxFrameRate: 60,
        minFrameRate: 60,
      },
    },
  }
}

chrome.windows.getCurrent(getInfo, async ({ tabs }) => {
  let tab = tabs[0]

  while (!tab.title.startsWith('{')) {
    tab = await await getTab(tab.id)
  }

  const config = JSON.parse(tab.title)

  window.socket = io(config.socket, {
    transports: ['websocket'],
    query: {
      token: config.token,
      type: 'server',
    },
  })

  window.rtc = new RTCPeerConnection({
    iceServers: config.ice
  })

  chrome.tabCapture.capture(captureOptions(tab), (stream) => {
    window.stream = stream

    window.socket.emit('launched')

    window.rtc.onicecandidate = (e) => {
      if (e.candidate) {
        window.socket.emit('candidate', e.candidate)
      }
    }

    window.rtc.onnegotiationneeded = async () => {
      const offer = await window.rtc.createOffer()

      await window.rtc.setLocalDescription(offer)

      window.socket.emit('offer', window.rtc.localDescription)
    }

    window.socket.on('candidate', (data) => {
      window.rtc.addIceCandidate(
        new RTCIceCandidate(data)
      )
    })

    window.socket.on('answer', (data) => {
      window.rtc.setRemoteDescription(
        new RTCSessionDescription(data)
      )
    })

    stream.getTracks().forEach((track) => {
      if (track.kind === 'audio') {
        track.contentHint = 'music'
      } else {
        track.contentHint = 'text'

        track.applyConstraints({
          width: { min: tab.width, ideal: tab.width * 2 },
          height: { min: tab.height, ideal: tab.height * 2},
        })
      }

      window.rtc.addTrack(track, stream)
    })
  })
})
