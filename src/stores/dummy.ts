import { atom } from 'jotai';

export const counterAtom = atom(0);

export const textAtom = atom('Hello World');

export const isActiveAtom = atom(false);

export const userAtom = atom({
  name: 'John Doe',
  email: 'john@example.com',
  age: 25,
});

export const itemsAtom = atom<string[]>(['Item 1', 'Item 2', 'Item 3']);

export const doubleCounterAtom = atom((get) => get(counterAtom) * 2);

export const incrementCounterAtom = atom(
  null,
  (get, set) => {
    set(counterAtom, get(counterAtom) + 1);
  }
);
