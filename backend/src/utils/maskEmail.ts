export default function maskEmail(email: string): string {
  if (!email) return email;

  const parts = email.split('@');
  if (parts.length !== 2) return email; // Fallback if format is weird

  const [local, domain] = parts;

  // If the email is super short like "ab@gmail.com", just star it out
  if (local.length <= 3) return `***@${domain}`;

  // Keep first 2 chars, hide the middle, keep the last char
  // e.g., "charlie@gmail.com" -> "ch***e@gmail.com"
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}
