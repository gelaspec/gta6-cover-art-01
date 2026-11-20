// v2: snapshot stack rewritten in this session; push dedupes identical states.
// Undo and redo for the cover state.
//
// The whole state is plain JSON, so a snapshot is just a string. One push
// per gesture: the editor records the state *before* the change, and the
// caption typing debounce makes sure a whole typed word is one entry, not
// one entry per keystroke. Nothing is pushed when the state did not change.

export function makeHistory(limit = 60) {
  return { past: [], future: [], limit };
}

function snapshot(state) {
  return JSON.stringify(state);
}

export function pushHistory(history, stateBefore) {
  const snap = snapshot(stateBefore);
  const last = history.past[history.past.length - 1];
  if (last === snap) return history;
  history.past.push(snap);
  while (history.past.length > history.limit) history.past.shift();
  history.future.length = 0;
  return history;
}

export function undoCover(history, currentState) {
  if (history.past.length === 0) return null;
  history.future.push(snapshot(currentState));
  return JSON.parse(history.past.pop());
}

export function redoCover(history, currentState) {
  if (history.future.length === 0) return null;
  history.past.push(snapshot(currentState));
  return JSON.parse(history.future.pop());
}

export function canUndo(history) {
  return history.past.length > 0;
}

export function canRedo(history) {
  return history.future.length > 0;
}
