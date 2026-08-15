export type SubmissionIntakeMode = "locked" | "synthetic" | "real";

type SubmissionIntakeInput = {
  nodeEnv?: string;
  vercelEnv?: string;
  realFlag?: string;
  syntheticFlag?: string;
};

export function submissionIntakeMode(input: SubmissionIntakeInput): SubmissionIntakeMode {
  if (input.nodeEnv === "test" || input.nodeEnv === "development") return "synthetic";
  if (input.vercelEnv === "preview") return input.syntheticFlag === "true" ? "synthetic" : "locked";
  if (input.vercelEnv === "production") return input.realFlag === "true" ? "real" : "locked";
  if (input.nodeEnv === "production") return input.realFlag === "true" ? "real" : "locked";
  return "locked";
}

export function submissionIntakeModeFromEnv() {
  return submissionIntakeMode({
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    realFlag: process.env.MMIPS_REAL_SUBMISSIONS_ENABLED,
    syntheticFlag: process.env.MMIPS_SYNTHETIC_SUBMISSIONS_ENABLED
  });
}

export function canadaSubmissionIntakeModeFromEnv() {
  return canadaSubmissionIntakeMode({
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    realFlag: process.env.MMIPS_CA_REAL_SUBMISSIONS_ENABLED,
    syntheticFlag: process.env.MMIPS_CA_SYNTHETIC_SUBMISSIONS_ENABLED
  });
}

export function canadaSubmissionIntakeMode(input: SubmissionIntakeInput): SubmissionIntakeMode {
  if (input.nodeEnv === "test" || input.nodeEnv === "development") return "synthetic";
  if (input.vercelEnv === "preview") return input.syntheticFlag === "true" ? "synthetic" : "locked";
  if (input.vercelEnv === "production" || input.nodeEnv === "production") {
    // Canada has completed the technical intake and moderation rehearsal. The
    // country production site is open by default; an exact false is the
    // emergency pause switch and never affects the separate U.S. release gate.
    return input.realFlag === "false" ? "locked" : "real";
  }
  return "locked";
}
