import React, { useState } from "react";

interface Option {
  label: string;
  value: string;
}

interface Props {
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
}

const FilterDropdown: React.FC<Props> = ({
  label,
  value,
  options,
  onChange,
}) => {
  const [open, setOpen] = useState(false);

  const selected =
    options.find((o) => o.value === value)?.label || label;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700
                   bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white
                   hover:bg-gray-50 dark:hover:bg-gray-700 min-w-[160px] text-left"
      >
        {selected}
      </button>

      {open && (
        <div
          className="absolute z-20 mt-1 w-full rounded-lg border
                     border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-sm text-left
                hover:bg-gray-100 dark:hover:bg-gray-700
                ${
                  opt.value === value
                    ? "font-medium text-[#4F46E5]"
                    : "text-gray-700 dark:text-gray-300"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
