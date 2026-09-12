import type * as React from "react";

type AuthFieldProps = {
  id: string;
  label: string;
  erro?: string;
  ladoDireito?: React.ReactNode;
  children: React.ReactNode;
};

export default function AuthField({ id, label, erro, ladoDireito, children }: AuthFieldProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        {ladoDireito}
      </div>
      {children}
      {erro ? (
        <p role="alert" className="mt-1.5 text-[13px] text-red-600">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
