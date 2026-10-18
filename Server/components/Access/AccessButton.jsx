"use client";
import { Button } from "primereact/button";
import { useAccess } from "./AccessProvider";
export function AccessButton({ permission, ...props }) {
  const { can } = useAccess();
  return !permission || can(permission) ? <Button {...props} /> : null;
}
