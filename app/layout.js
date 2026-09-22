import "./globals.css";

export const metadata = {
  title: "Transport Hub",
  description: "Transport Hub Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}