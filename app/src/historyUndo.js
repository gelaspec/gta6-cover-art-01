// Undo / redo for the whole cover state: one snapshot per committed change
// (layout, grade, caption, panel framing, toggles). Snapshots are plain JSON
// so they are cheap to copy and compare; the editor only pushes when the
// serialised state actually changed.

// A bounded stack of past states plus the states undone (for redo).
export function makeHistory(limit = 60) {
  return { past: [], future: [], limit };
}

function serialise(state) {
  return JSON.stringify(state);
}

// Records the state BEFORE a change. Call it once per user gesture, not per
// keystroke: the editor debounces caption typing before pushing.
export function pushHistory(history, stateBefore) {
  const snap = serialise(stateBefore);
  if (history.past.length && history.past[history.past.length - 1] === snap) return history;
  history.past.push(snap);
  if (history.past.length > history.limit) history.past.shift();
  history.future.length = 0;
  return history;
}

// Steps one state back. Returns the restored state object, or null when
// there is nothing to undo. The current state is saved for redo.
export function undoCover(history, currentState) {
  if (!history.past.length) return null;
  history.future.push(serialise(currentState));
  const snap = history.past.pop();
  return JSON.parse(snap);
}

// Steps one state forward. Returns the restored state, or null.
export function redoCover(history, currentState) {
  if (!history.future.length) return null;
  history.past.push(serialise(currentState));
  const snap = history.future.pop();
  return JSON.parse(snap);
}

export function canUndo(history) {
  return history.past.length > 0;
}

export function canRedo(history) {
  return history.future.length > 0;
}
