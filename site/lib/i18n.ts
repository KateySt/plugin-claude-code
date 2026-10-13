import en from "@/messages/en.json";

type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<typeof en>;

export function t(
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const message = key
    .split(".")
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], en);
  return (message as string).replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    vars && name in vars ? String(vars[name]) : placeholder,
  );
}
