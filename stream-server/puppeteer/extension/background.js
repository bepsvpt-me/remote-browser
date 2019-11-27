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

  const rtc = window.rtc = new RTCPeerConnection({
    iceServers: [{
      urls: `turn:${query.get('host')}:3478`,
      username: query.get('username'),
      credential: query.get('password'),
    }],
  });

  chrome.tabCapture.capture(options, (stream) => {
    rtc.onicecandidate = (e) => {
      e.candidate && socket.emit('candidate', e.candidate);
    };

    rtc.onnegotiationneeded = async () => {
      const offer = await rtc.createOffer();

      offer.sdp = `${offer.sdp}b=AS:9999999\r\n`;

      offer.sdp = offer.sdp.replace('96 97 98 99', '98 99');

      offer.sdp = offer.sdp.split("\r\n").filter((type) => !(type.includes(':96') || type.includes(':97'))).join("\r\n");

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
