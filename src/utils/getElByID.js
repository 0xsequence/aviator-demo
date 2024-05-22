export function getElByID(id) {
  const el = document.getElementById(id);
  if(!el) {
    throw new Error("could not find element with id: "+ id)
  }
  return el
}
