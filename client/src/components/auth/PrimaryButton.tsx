import type * as React from "react";
import { Loader2 } from "lucide-react";

type PrimaryButtonProps = {
  carregando?: boolean;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function PrimaryButton({ carregando, children, ...rest }: PrimaryButtonProps) {
  return (
    <button
      {...rest}
      type="submit"
      disabled={carregando || rest.disabled}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-blue-700 text-[15px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-blue-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {carregando ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
      {children}
    </button>
  );
}
