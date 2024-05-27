import { getElByID } from "./getElByID";

export function getElByIDChain(...args) {
  const workingIDs = Array.prototype.slice.call(args)
  let el = getElByID(workingIDs.shift());
  while (workingIDs.length > 0) {
      const children = Array.from(el.children);
      const childID = workingIDs.shift();
      let newEl = children.find(el => el.id === childID);
      if(!newEl) {
        throw new Error("No element!")
      }
    el = newEl
  }
  if(!el) {
    throw new Error("could not find element with id chain: "+ ids)
  }
  return el;
}
