import type * as React from "react";

type TextInputProps = {
  id: string;
  icone?: React.ReactNode;
  comErro?: boolean;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export default function TextInput({ id, icone, comErro, className, ...rest }: TextInputProps) {
  const base =
    "h-12 w-full rounded-[10px] border bg-white text-base text-slate-900 outline-none transition-all duration-150 placeholder:text-slate-400 disabled:bg-slate-50 disabled:opacity-60";
  const padding = icone ? "pl-11 pr-4" : "px-4";
  const estado = comErro
    ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
    : "border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15";
  const extra = className ?? "";

  return (
    <div className="relative">
      {icone ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 [&_svg]:h-5 [&_svg]:w-5"
        >
          {icone}
        </span>
      ) : null}
      <input id={id} className={`${base} ${padding} ${estado} ${extra}`.trim()} {...rest} />
    </div>
  );
}
