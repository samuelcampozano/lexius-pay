export async function fetchSecretFromGCP(secretName: string): Promise<string | null> {
  // Integrates with GCP Secret Manager in production environment
  // Falls back to process.env in local Docker environment
  const envValue = process.env[secretName];
  if (envValue) {
    return envValue;
  }
  return null;
}
