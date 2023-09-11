// export function getMetadata(name, doc = document) {
//   const attr = name && name.includes(':') ? 'property' : 'name';
//   const meta = doc.head.querySelector(`meta[${attr}="${name}"]`);
//   return meta && meta.content;
// }

export function getMetadata() {
  return null;
}

export const getConfig = () => ({});
