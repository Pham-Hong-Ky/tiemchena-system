import React from "react";

const BASE_CLASS =
  "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  extraClass?: string;
}

export function FormInput({ label, extraClass = "", ...props }: FormInputProps) {
  return (
    <div>
      <label className="block font-bold text-slate-700 mb-1 text-xs">{label}</label>
      <input className={`${BASE_CLASS} ${extraClass}`} {...props} />
    </div>
  );
}
