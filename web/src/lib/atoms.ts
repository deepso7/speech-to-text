import { atom, useAtomValue } from "jotai";

export const wsAtom = atom<WebSocket | null>(null);

export const useWs = () => useAtomValue(wsAtom);
