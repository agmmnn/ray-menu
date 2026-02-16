import { forwardRef, useImperativeHandle } from "react";
import { useRayMenu, type UseRayMenuReturn } from "./useRayMenu";
import type { RayMenuControllerOptions } from "../shared/controller";

export type RayMenuRef = UseRayMenuReturn;

export const RayMenu = forwardRef<RayMenuRef, RayMenuControllerOptions>(
  function RayMenu(props, ref) {
    const menu = useRayMenu(props);

    useImperativeHandle(ref, () => menu, [menu]);

    // WC is body-appended, nothing to render
    return null;
  },
);
