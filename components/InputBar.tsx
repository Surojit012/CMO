"use client";

import { FormEvent } from "react";

type InputBarProps = {
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (url: string) => void;
  onButtonClick?: () => void;
  buttonLabel?: string;
  buttonLoading?: boolean;
  placeholder?: string;
};

export function InputBar({
  disabled = false,
  value,
  onChange,
  onSubmit,
  onButtonClick,
  buttonLabel = "Analyze",
  buttonLoading = false,
  placeholder = "Enter your website URL..."
}: InputBarProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedValue = value.trim();
    if (!trimmedValue || disabled) {
      return;
    }

    onSubmit(trimmedValue);
  }

  function handleButtonClick() {
    if (disabled || buttonLoading) {
      return;
    }

    onButtonClick?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-[20px] bg-white/92 p-2 shadow-[0_12px_50px_rgba(0,0,0,0.08)] ring-1 ring-black/5 backdrop-blur-md sm:flex-row sm:items-center sm:gap-3 sm:rounded-[28px]"
    >
      <input
        type="text"
        inputMode="url"
        placeholder={placeholder}
        aria-label="Website URL"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-11 flex-1 rounded-[16px] bg-transparent px-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed sm:h-12 sm:rounded-[22px] sm:px-4"
      />
      <button
        type={onButtonClick ? "button" : "submit"}
        onClick={onButtonClick ? handleButtonClick : undefined}
        disabled={disabled || buttonLoading || (!onButtonClick && !value.trim())}
        className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-[16px] bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 sm:h-12 sm:w-auto sm:rounded-[22px] sm:px-5"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
