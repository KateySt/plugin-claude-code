import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Root({ children, className }: { children: ReactNode; className?: string }) {
  return <Card className={cn("gap-2", className)}>{children}</Card>;
}

function Header({ children }: { children: ReactNode }) {
  return <CardHeader className="flex flex-wrap items-center gap-2">{children}</CardHeader>;
}

function Title({ href, children }: { href: string; children: ReactNode }) {
  return (
    <h3 className="font-medium">
      <Link href={href} className="hover:underline">
        {children}
      </Link>
    </h3>
  );
}

function Meta({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1">{children}</div>;
}

function Description({ children }: { children: ReactNode }) {
  return <CardContent className="text-sm text-muted-foreground">{children}</CardContent>;
}

function Actions({ children }: { children: ReactNode }) {
  return <CardFooter className="gap-2">{children}</CardFooter>;
}

export const ArtifactCard = Object.assign(Root, {
  Header,
  Title,
  Meta,
  Description,
  Actions,
});
