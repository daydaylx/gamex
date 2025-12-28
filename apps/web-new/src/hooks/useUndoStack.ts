/**
 * useUndoStack Hook
 * Manages undo/redo stack for interview answers
 */

import { useState, useCallback } from "preact/hooks";

export interface UndoableAction<T> {
  type: string;
  data: T;
  timestamp: number;
}

export function useUndoStack<T>(maxStackSize = 10) {
  const [stack, setStack] = useState<UndoableAction<T>[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const push = useCallback(
    (type: string, data: T) => {
      setStack((prev) => {
        // Remove any "future" actions after current index
        const newStack = prev.slice(0, currentIndex + 1);

        // Add new action
        newStack.push({
          type,
          data,
          timestamp: Date.now(),
        });

        // Limit stack size
        if (newStack.length > maxStackSize) {
          newStack.shift();
          setCurrentIndex(maxStackSize - 1);
          return newStack;
        }

        setCurrentIndex(newStack.length - 1);
        return newStack;
      });
    },
    [currentIndex, maxStackSize]
  );

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      return stack[currentIndex - 1];
    }
    return null;
  }, [currentIndex, stack]);

  const redo = useCallback(() => {
    if (currentIndex < stack.length - 1) {
      setCurrentIndex(currentIndex + 1);
      return stack[currentIndex + 1];
    }
    return null;
  }, [currentIndex, stack]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < stack.length - 1;
  const current = currentIndex >= 0 ? stack[currentIndex] : null;

  const clear = useCallback(() => {
    setStack([]);
    setCurrentIndex(-1);
  }, []);

  return {
    push,
    undo,
    redo,
    canUndo,
    canRedo,
    current,
    clear,
    stack,
  };
}
