import { useEffect, useRef, useMemo } from "react";
import {
  RayMenuController,
  type RayMenuControllerOptions,
} from "../shared/controller";
import type { MenuItem } from "../core";

export interface UseRayMenuReturn {
  open: (x: number, y: number) => void;
  close: () => void;
  toggle: (x: number, y: number) => void;
  goBack: () => boolean;
  goToRoot: () => void;
  openAsDropTarget: (x: number, y: number) => void;
  updateHoverFromPoint: (x: number, y: number) => void;
  dropOnHovered: (data?: unknown) => MenuItem | null;
  cancelDrop: () => void;
  getHoveredItem: () => MenuItem | null;
  readonly isOpen: boolean;
  readonly isDropTarget: boolean;
  readonly isLoading: boolean;
  readonly submenuDepth: number;
  readonly items: MenuItem[];
  readonly element: HTMLElement | null;
}

export function useRayMenu(
  options: RayMenuControllerOptions,
): UseRayMenuReturn {
  const controllerRef = useRef<RayMenuController | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Mount/unmount
  useEffect(() => {
    let destroyed = false;
    const controller = new RayMenuController(optionsRef.current);

    controller.init().then(() => {
      if (destroyed) {
        controller.destroy();
        return;
      }
      controllerRef.current = controller;
    });

    return () => {
      destroyed = true;
      controllerRef.current = null;
      controller.destroy();
    };
  }, []);

  // Sync options on change
  useEffect(() => {
    controllerRef.current?.update(options);
  });

  return useMemo(
    () => ({
      open: (x: number, y: number) => controllerRef.current?.open(x, y),
      close: () => controllerRef.current?.close(),
      toggle: (x: number, y: number) => controllerRef.current?.toggle(x, y),
      goBack: () => controllerRef.current?.goBack() ?? false,
      goToRoot: () => controllerRef.current?.goToRoot(),
      openAsDropTarget: (x: number, y: number) =>
        controllerRef.current?.openAsDropTarget(x, y),
      updateHoverFromPoint: (x: number, y: number) =>
        controllerRef.current?.updateHoverFromPoint(x, y),
      dropOnHovered: (data?: unknown) =>
        controllerRef.current?.dropOnHovered(data) ?? null,
      cancelDrop: () => controllerRef.current?.cancelDrop(),
      getHoveredItem: () => controllerRef.current?.getHoveredItem() ?? null,
      get isOpen() {
        return controllerRef.current?.isOpen ?? false;
      },
      get isDropTarget() {
        return controllerRef.current?.isDropTarget ?? false;
      },
      get isLoading() {
        return controllerRef.current?.isLoading ?? false;
      },
      get submenuDepth() {
        return controllerRef.current?.submenuDepth ?? 0;
      },
      get items() {
        return controllerRef.current?.items ?? [];
      },
      get element() {
        return controllerRef.current?.element ?? null;
      },
    }),
    [],
  );
}
