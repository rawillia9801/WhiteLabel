import { tenantConfig } from "../lib/tenant-config";

export function TenantTheme({ primary, accent, fontFamily }: { primary?: string; accent?: string; fontFamily?: string }) {
  const theme = tenantConfig.theme;
  const css = `:root{--tenant-primary:${primary || theme.primary};--tenant-primary-dark:${theme.primaryDark};--tenant-accent:${accent || theme.accent};--tenant-background:${theme.background};--tenant-surface:${theme.surface};--tenant-text:${theme.text};--tenant-muted:${theme.mutedText};--tenant-border:${theme.border};--tenant-radius:${theme.radius};--tenant-font:${JSON.stringify(fontFamily || "Geist")},var(--font-geist-sans),Arial,sans-serif;accent-color:var(--tenant-primary)}body{font-family:var(--tenant-font)}a{color:var(--tenant-primary-dark)}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid color-mix(in srgb,var(--tenant-primary) 34%,transparent);outline-offset:2px}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
