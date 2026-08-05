import { NextResponse } from "next/server";

type ApiErrorOptions = {
  status?: number;
  code: string;
  message: string;
  log?: boolean;
};

export function logOperationalError(code: string) {
  console.error("MMIPS API operation failed.", { code });
}

export function safeApiError({ status = 500, code, message, log = status >= 500 }: ApiErrorOptions) {
  if (log) logOperationalError(code);
  return NextResponse.json({ ok: false, message, code }, { status });
}
