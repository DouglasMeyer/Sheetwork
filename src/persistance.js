const namespace = 'Sheetwork';

export function get(key, fallback = null) {
  const itemName = `${namespace}_${key}`;
  if (!localStorage.hasOwnProperty(itemName)) {
    set(key, fallback);
  }
  return JSON.parse(localStorage.getItem(itemName));
}

export function set(key, value) {
  const itemName = `${namespace}_${key}`;
  localStorage.setItem(itemName, JSON.stringify(value));
}
