/**
 * Creates a comparator function that sorts items based on a given order.
 *
 * @param order The order in which the items are to be sorted.
 *
 * @returns The comparator function that sorts items based on the given order. This function will throw if either of the
 *          values passed to it are not present in `order`.
 */
export function byOrder<T>(order: readonly T[]): (a: T, b: T) => number/**
 * Creates a comparator function that sorts items based on an explicit order of keys derived from the items.
 *
 * @param order The order in which the items are to be sorted.
 * @param getKey An optional function that derives a value from each item to be used for sorting.
 *
 * @returns The comparator function that sorts items based on the given order. This function will throw if either of the
 *          values passed to it are not present in `order`.
 */
export function byOrder<T, U>(order: readonly U[], getKey: (value: T) => U): (a: T, b: T) => number
export function byOrder<T, U>(order: readonly U[], getKey?: (value: T) => U): (a: T, b: T) => number {
  const orderIndex = new Map<U, number>()
  order.forEach((value, index) => {
    orderIndex.set(value, index)
  })
  if (!getKey) {
    getKey = (value: T) => value as unknown as U
  }
  return (a: T, b: T) => {
    const aIndex = orderIndex.get(getKey(a))
    const bIndex = orderIndex.get(getKey(b))
    if (aIndex === undefined) {
      throw Error('Value ' + a + ' not present in ' + order.toString())
    }
    if (bIndex === undefined) {
      throw Error('Value ' + b + ' not present in ' + order.toString())
    }
    return aIndex - bIndex
  }
}

export function byDesc<T>(accessor: (element: T) => number) {
  return (a: T, b: T) => accessor(b) - accessor(a)
}
