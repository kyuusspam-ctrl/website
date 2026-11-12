export const initialBooks=[];
export const placeholders={photo:'A little scene, held still.',gif:'A moving memory, looping softly.',audio:'A tiny recording from that day.',video:'A few seconds from the afternoon.',note:'A message tucked inside.'};
export function cloneBooks(){return structuredClone(initialBooks)}
