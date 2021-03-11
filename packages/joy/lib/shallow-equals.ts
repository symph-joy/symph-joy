const hasOwn = Object.prototype.hasOwnProperty;

function is(x: any, y: any) {
  if (x === y) {
    return x !== 0 || y !== 0 || 1 / x === 1 / y;
  } else {
    return Number.isNaN(x) && Number.isNaN(y);
  }
}

/**
 *
 * @param objA
 * @param objB
 * @param exclude  这些属性，不参与参与比较
 * @returns {boolean}
 */
export function isShallowEqual(
  objA: any,
  objB: any,
  { exclude }: { exclude?: Array<any> } = {}
): boolean {
  if (is(objA, objB)) return true;

  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false;
  }

  let keysA = Object.keys(objA);
  let keysB = Object.keys(objB);
  if (exclude && exclude.length > 0) {
    keysA = keysA.filter((i: any) => !exclude.includes(i));
    keysB = keysB.filter((i: any) => !exclude.includes(i));
  }
  if (keysA.length !== keysB.length) return false;

  for (var i = 0; i < keysA.length; i++) {
    if (!hasOwn.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      // console.log('>>>> prop no equat', keysA[i])
      return false;
    }
  }

  return true;
}
