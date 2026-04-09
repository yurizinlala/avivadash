export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login has its own full-page layout — no sidebar/header
  return <>{children}</>;
}
