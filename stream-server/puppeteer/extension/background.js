let init = false;

chrome.tabs.onUpdated.addListener((id, info, tab) => {
  const title = info.title;

  if (init || !title || !title.startsWith('e?')) {
    return;
  }

  init = true;

  const query = new URLSearchParams(title.substring(1));

  const options = {
    audio: true,
    video: true,
    videoConstraints: {
      mandatory: {
        maxWidth: tab.width,
        minWidth: tab.width,
        maxHeight: tab.height,
        minHeight: tab.height,
        maxFrameRate: 60,
        minFrameRate: 30,
      },
    },
  };

  const socket = io(`http${parseInt(query.get('secure'), 10) ? 's' : ''}://${query.get('host')}:${query.get('port')}`, {
    query: {
      token: query.get('token'),
      type: 'server',
    },
  });

  const rtc = window.rtc = new RTCPeerConnection(!query.get('turnServer') ? {} : {
    iceServers: [{
      urls: query.get('turnServer'),
      username: query.get('turnUsername'),
      credential: query.get('turnPassword'),
    }],
  });

  chrome.tabCapture.capture(options, (stream) => {
    rtc.onicecandidate = (e) => {
      e.candidate && socket.emit('candidate', e.candidate);
    };

    rtc.onnegotiationneeded = async () => {
      const offer = await rtc.createOffer();

      // offer.sdp = `${offer.sdp}b=AS:9999999\r\n`;

      await rtc.setLocalDescription(offer);

      socket.emit('offer', rtc.localDescription);
    };

    socket.on('candidate', (data) => {
      rtc.addIceCandidate(new RTCIceCandidate(data));
    });

    socket.on('answer', (data) => {
      rtc.setRemoteDescription(new RTCSessionDescription(data));
    });

    stream.getTracks().forEach((track) => {
      rtc.addTrack(track, stream);
    });
  });
});
