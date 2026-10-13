"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { t, type MessageKey } from "@/lib/i18n";

const COPIED_MS = 2000;

interface CopyButtonProps {
  text: string;
  label: MessageKey;
}

/** Fallback when the async clipboard API is missing: select the text and copy. */
function copyBySelection(text: string): void {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(area);
  }
}

export function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function handleClick() {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else copyBySelection(text);
    } catch {
      copyBySelection(text);
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick}>
      <span aria-live="polite">{copied ? t("install.copied") : t(label)}</span>
    </Button>
  );
}
