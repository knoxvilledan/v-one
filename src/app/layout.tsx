import React from "react";
import "./globals.css"; // Ensure global styles are applied

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-gray-100 font-sans p-2">
        {children}
      </body>
    </html>
  );
}
