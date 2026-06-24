export function pulse(selector: string): void {
  const element = document.querySelector(selector);
  if (!element) return;
  element.classList.remove('pulse');
  window.requestAnimationFrame(() => element.classList.add('pulse'));
}

export function vibrate(ms = 25): void {
  if ('vibrate' in navigator) navigator.vibrate(ms);
}
