// src/utils/handleUtils.ts
export const formatHandleForDisplay = (handle: string) => {
  return handle.endsWith('.base') ? handle : `${handle}.base`;
};

export const stripHandleSuffix = (handle: string) => {
  return handle.replace(/\.base$/, '');
};