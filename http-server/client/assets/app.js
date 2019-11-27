const welcome = document.querySelector('div.welcome');
const browsing = document.querySelector('div.browsing');
const stream = document.querySelector('div.stream');
const speed = document.querySelector('span.speed');
const url = document.querySelector('input[name="url"]');
const video = document.querySelector('video');

(async () => {
  if (!('RTCPeerConnection' in window)) {
    welcome.textContent = 'This page requires WebRTC!';

    browsing.remove();
  } else {
    welcome.addEventListener('click', () => {
      welcome.remove();

      if (video.paused) {
        video.play();
      }
    });

    const turn = await (await fetch('/credentials.json')).json();

    const token = (() => {
      try {
        if (localStorage.getItem('token')) {
          return localStorage.getItem('token');
        }
      } catch (e) {
        //
      }

      // uuid v4, source: https://stackoverflow.com/a/2117523
      const token = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );

      try {
        localStorage.setItem('token', token);
      } catch (e) {
        //
      }

      return token;
    })();

    let bytes = 0;

    const connectionSpeed = async () => {
      const stats = await window.rtc.getStats();

      let sum = 0;

      stats.forEach((report) => {
        if (report.type === 'inbound-rtp') {
          sum += report.bytesReceived;
        }
      });

      speed.textContent = ((sum - bytes) / 1024).toFixed(0);

      bytes = sum;
    };

    const socket = io({
      query: { token }
    });

    socket.emit('launch', {
      height: stream.clientHeight,
      width: stream.clientWidth,
      deviceScaleFactor: window.devicePixelRatio,
    });

    socket.on('launched', () => {
      url.addEventListener('change', () => {
        url.blur();

        socket.emit('navigation', url.value);
      });

      socket.on('navigation', (data) => url.value = data);

      bindEvents(socket);

      setInterval(connectionSpeed, 1000);
    });

    window.rtc = new RTCPeerConnection({
      iceServers: [{
        urls: `turn:${turn.host}:3478`,
        username: turn.username,
        credential: turn.password,
      }],
    });

    window.rtc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('candidate', e.candidate);

        if (video.paused) {
          video.play();
        }
      }
    };

    window.rtc.ontrack = (e) => {
      document.querySelector('video').srcObject = e.streams[0];
    };

    socket.on('offer', async (data) => {
      await window.rtc.setRemoteDescription(new RTCSessionDescription(data));

      await window.rtc.setLocalDescription(await window.rtc.createAnswer());

      socket.emit('answer', window.rtc.localDescription);
    });

    socket.on('candidate', (data) => {
      window.rtc.addIceCandidate(new RTCIceCandidate(data));
    });
  }
})();
