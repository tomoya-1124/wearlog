export function makeShareId(): string {
  // URLに載せても扱いやすい短めID（英数字）
  return crypto.randomUUID();
}
