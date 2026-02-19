"use client";

import { useActionState } from "react";
import type { ActionResult } from "./types";

type ActionFn = (
  prevState: ActionResult | undefined,
  formData: FormData
) => Promise<ActionResult>;

type ActionFormProps = {
  action: ActionFn;
  className?: string;
  children: React.ReactNode;
};

export function ActionForm({ action, className, children }: ActionFormProps) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className={className} encType="multipart/form-data">
      {children}
      {isPending ? (
        <p className="text-xs text-zinc-500 md:col-span-2" aria-live="polite">
          Working...
        </p>
      ) : null}
      {state?.message ? (
        <p
          className={
            state.ok
              ? "text-sm text-emerald-600 md:col-span-2"
              : "text-sm text-red-600 md:col-span-2"
          }
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
