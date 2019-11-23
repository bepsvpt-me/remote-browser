const offsetY = 38;

const bindEvents = (socket) => {
  const coordinate = (e) => {
    return {
      x: e.clientX,
      y: e.clientY - offsetY,
    };
  };

  // mouse event

  document.addEventListener('mousemove', (e) => {
    socket.emit('mousemove', coordinate(e));
  });

  document.addEventListener('mousedown', () => {
    socket.emit('mousedown');
  });

  document.addEventListener('mouseup', () => {
    socket.emit('mouseup');
  });

  document.addEventListener('dblclick', (e) => {
    socket.emit('dblclick', coordinate(e));
  });

  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    socket.emit('right-click', coordinate(e));
  });

  // keyboard event

  document.addEventListener('keydown', (e) => {
    socket.emit('keydown', e.key);
  });

  document.addEventListener('keyup', (e) => {
    socket.emit('keyup', e.key);
  });

  // wheel event

  document.addEventListener('wheel', (e) => {
    socket.emit('wheel', { x: e.deltaX, y: e.deltaY });
  });
};
