export function getChildByClassChain(parent, ...args) {
  const workingClasses = Array.prototype.slice.call(args)
  let el = parent;
  while (workingClasses.length > 0) {
      const children = Array.from(el.children);
      const childClass = workingClasses.shift();
      let newEl = children.find(el => el.classList.contains(childClass));
      if(!newEl) {
        throw new Error("No element!")
      }
    el = newEl
  }
  if(!el) {
    throw new Error("could not find element with class chain: "+ ids)
  }
  return el;
}
