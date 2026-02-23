import React, { useState, useEffect } from "react";
import { Detail, showToast, Toast } from "@vicinae/api";
import { ZedContext, getZedContext } from "../lib/zed";
import { MIN_SUPPORTED_DB_VERSION } from "../lib/db";

interface WithZedProps {
  children: (context: ZedContext) => React.ReactNode;
}

export function WithZed({ children }: WithZedProps) {
  const [context, setContext] = useState<ZedContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getZedContext()
      .then((ctx) => {
        if (!ctx) {
          setError("Zed is not installed or the database was not found.");
          return;
        }
        if (ctx.dbVersion < MIN_SUPPORTED_DB_VERSION) {
          setError(
            `Zed database version ${ctx.dbVersion} is not supported. Please update Zed (requires DB version ≥ ${MIN_SUPPORTED_DB_VERSION}).`
          );
          return;
        }
        setContext(ctx);
      })
      .catch((err) => {
        setError(String(err));
      });
  }, []);

  if (error) {
    return <Detail markdown={`## Zed Not Available\n\n${error}`} />;
  }

  if (!context) {
    return <Detail isLoading markdown="" />;
  }

  return <>{children(context)}</>;
}
