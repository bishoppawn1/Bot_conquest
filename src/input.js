const KEY_MAP = {
  KeyA:'left', KeyD:'right', KeyW:'jump', KeyS:'down',
  ShiftLeft:'dash', ShiftRight:'dash', Space:'attack',
  KeyE:'heal', KeyQ:'field', KeyF:'electricJab', KeyO:'rest',
  a:'left', A:'left', d:'right', D:'right', w:'jump', W:'jump', s:'down', S:'down',
  e:'heal', E:'heal', q:'field', Q:'field', f:'electricJab', F:'electricJab', o:'rest', O:'rest',
  Shift:'dash', ' ':'attack', SPACE:'attack'
};

export const actionFor = event => KEY_MAP[event.code] ?? KEY_MAP[event.key];

export function bindInput({ getGame, isPlaying, begin }) {
  const keydown = event => {
    if (event.code === 'Enter' && !isPlaying()) begin();
    if (event.code === 'KeyR') begin();
    const action = actionFor(event);
    if (action) { getGame().setInput({ [action]: true }); event.preventDefault(); }
  };
  const keyup = event => {
    const action = actionFor(event);
    if (action) getGame().setInput({ [action]: false });
  };
  addEventListener('keydown', keydown);
  addEventListener('keyup', keyup);
  return () => { removeEventListener('keydown', keydown); removeEventListener('keyup', keyup); };
}
