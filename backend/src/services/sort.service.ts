export function naturalCompare(left: string, right: string): number {
  if (left === right) return 0;

  const leftMatch = /^([A-Z_a-z]+)(\d+)$/.exec(left);
  const rightMatch = /^([A-Z_a-z]+)(\d+)$/.exec(right);

  if (leftMatch && rightMatch && leftMatch[1] === rightMatch[1]) {
    return Number(leftMatch[2]) - Number(rightMatch[2]);
  }

  if (left === "DEAD") return 1;
  if (right === "DEAD") return -1;
  return left.localeCompare(right);
}

export function symbolLabel(symbol: string | null): string {
  return symbol === null ? "ε" : symbol;
}
