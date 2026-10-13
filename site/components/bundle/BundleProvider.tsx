"use client";

import {
  createContext,
  Suspense,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { parseBundleParam, serializeBundleParam } from "@/lib/bundle/param";
import type { BundleSource } from "@/lib/bundle/settings";

export const BUNDLE_STORAGE_KEY = "kateyst-plugins:bundle";

export interface BundleContextValue {
  plugins: string[];
  toggle(name: string): void;
  has(name: string): boolean;
  save(): void;
  source: BundleSource;
  fromUrl: boolean;
  unknown: string[];
}

const BundleContext = createContext<BundleContextValue | null>(null);

export function useBundle(): BundleContextValue {
  const value = use(BundleContext);
  if (!value) throw new Error("useBundle must be used inside BundleProvider");
  return value;
}

function readStorage(known: Set<string>): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(BUNDLE_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n): n is string => typeof n === "string" && known.has(n));
  } catch {
    return [];
  }
}

function writeStorage(plugins: string[]): void {
  try {
    localStorage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify(plugins));
  } catch {
    // Storage may be unavailable (private mode); the bundle still works in memory.
  }
}

interface InitState {
  plugins: string[];
  fromUrl: boolean;
  unknown: string[];
  onBundlePage: boolean;
}

/** Reads the URL once under Suspense (static export requirement) and reports the initial state. */
function UrlInit({
  known,
  onInit,
  writtenRef,
}: {
  known: string[];
  onInit: (state: InitState) => void;
  writtenRef: { current: string | null | undefined };
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const param = params.get("plugins");
  const onBundlePage = pathname.replace(/\/+$/, "").endsWith("/bundle");

  useEffect(() => {
    if (!onBundlePage) writtenRef.current = undefined;
    // The URL change was writtenRef by toggle; local state is already current.
    if (onBundlePage && param === writtenRef.current) return;
    if (onBundlePage && param !== null) {
      const { plugins, unknown } = parseBundleParam(param, known);
      onInit({ plugins, fromUrl: true, unknown, onBundlePage });
    } else {
      onInit({
        plugins: readStorage(new Set(known)),
        fromUrl: false,
        unknown: [],
        onBundlePage,
      });
    }
  }, [onBundlePage, param, known, onInit, writtenRef]);

  return null;
}

export function BundleProvider({
  source,
  children,
}: {
  source: BundleSource;
  children: ReactNode;
}) {
  const [state, setState] = useState<InitState>({
    plugins: [],
    fromUrl: false,
    unknown: [],
    onBundlePage: false,
  });
  const latest = useRef(state);
  const applyInit = useCallback((next: InitState) => {
    latest.current = next;
    setState(next);
  }, []);
  const writtenRef = useRef<string | null | undefined>(undefined);
  const known = useMemo(() => source.plugins.map((p) => p.name), [source]);

  const commit = useCallback((plugins: string[], onBundlePage: boolean) => {
    writeStorage(plugins);
    if (onBundlePage) {
      const query = serializeBundleParam(plugins);
      writtenRef.current = query;
      const url = `${window.location.pathname}?plugins=${query}`;
      window.history.replaceState(window.history.state, "", url);
    }
  }, []);

  const toggle = useCallback(
    (name: string) => {
      const s = latest.current;
      const plugins = s.plugins.includes(name)
        ? s.plugins.filter((n) => n !== name)
        : [...s.plugins, name].sort();
      const next = { ...s, plugins, fromUrl: false };
      latest.current = next;
      setState(next);
      commit(plugins, s.onBundlePage);
    },
    [commit],
  );

  const save = useCallback(() => {
    const next = { ...latest.current, fromUrl: false };
    latest.current = next;
    writeStorage(next.plugins);
    setState(next);
  }, []);

  const value = useMemo<BundleContextValue>(
    () => ({
      plugins: state.plugins,
      toggle,
      has: (name) => state.plugins.includes(name),
      save,
      source,
      fromUrl: state.fromUrl,
      unknown: state.unknown,
    }),
    [state, toggle, save, source],
  );

  return (
    <BundleContext value={value}>
      <Suspense fallback={null}>
        <UrlInit known={known} onInit={applyInit} writtenRef={writtenRef} />
      </Suspense>
      {children}
    </BundleContext>
  );
}
