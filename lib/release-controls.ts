export function realSubmissionIntakeEnabled(input: { nodeEnv?: string; flag?: string }) {
  if (input.nodeEnv !== "production") return true;
  return input.flag === "true";
}

export function realSubmissionIntakeEnabledFromEnv() {
  return realSubmissionIntakeEnabled({
    nodeEnv: process.env.NODE_ENV,
    flag: process.env.MMIPS_REAL_SUBMISSIONS_ENABLED
  });
}
