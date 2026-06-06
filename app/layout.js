import "./globals.css";
import AppFrame from "@/components/AppFrame";

export const metadata = {
  title: "B Socio Studio",
  description: "Be Seen. Be Social. Digital marketing agency management software.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/bsocio.svg" }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
