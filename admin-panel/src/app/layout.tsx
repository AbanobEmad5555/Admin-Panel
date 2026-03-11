import type { Metadata } from "next";
import Script from "next/script";
import AppProviders from "@/components/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "E-commerce admin panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <Script id="strip-bis-attrs" strategy="beforeInteractive">
          {`
            (function () {
              var attrs = ["bis_skin_checked", "bis_register"];
              function strip() {
                for (var i = 0; i < attrs.length; i++) {
                  var name = attrs[i];
                  var nodes = document.querySelectorAll("[" + name + "]");
                  for (var j = 0; j < nodes.length; j++) {
                    nodes[j].removeAttribute(name);
                  }
                }
              }
              strip();
              new MutationObserver(strip).observe(document.documentElement, {
                subtree: true,
                attributes: true,
                attributeFilter: attrs,
              });
            })();
          `}
        </Script>
      </head>
      <body
        className="min-h-screen bg-slate-100 text-slate-900 antialiased"
        suppressHydrationWarning
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
