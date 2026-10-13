'use strict';
function restoreColors(current, original, last) {
  const result = { ...current };
  for (const [key, value] of Object.entries(last)) {
    if (result[key] !== value) continue; // Preserve subsequent manual edits.
    if (Object.prototype.hasOwnProperty.call(original, key)) result[key] = original[key];
    else delete result[key];
  }
  return result;
}
module.exports = { restoreColors };
