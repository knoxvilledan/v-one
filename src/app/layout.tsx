import React from "react";
import type { Metadata } from "next";
import Providers from "../components/Providers";
import "./globals.css"; // Ensure global styles are applied

export const metadata: Metadata = {
  title: "AMP Tracker - Daily Productivity & Habit Tracker",
  description:
    "Track your daily productivity, habits, and goals with AMP Tracker. Monitor your progress, build better habits, and achieve your ideal day.",
  keywords: [
    "productivity",
    "habit tracker",
    "daily planner",
    "goals",
    "time management",
    "self improvement",
  ],
  authors: [{ name: "Knox" }],
  creator: "Knox",
  publisher: "Knox",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://amp-tracker.vercel.app"), // Update this with your actual domain
  openGraph: {
    title: "AMP Tracker - Daily Productivity & Habit Tracker",
    description:
      "Track your daily productivity, habits, and goals with AMP Tracker. Monitor your progress, build better habits, and achieve your ideal day.",
    url: "https://amp-tracker.vercel.app", // Update this with your actual domain
    siteName: "AMP Tracker",
    images: [
      {
        url: "/og-image.png", // You can add this later
        width: 1200,
        height: 630,
        alt: "AMP Tracker - Daily Productivity & Habit Tracker",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AMP Tracker - Daily Productivity & Habit Tracker",
    description:
      "Track your daily productivity, habits, and goals with AMP Tracker.",
    images: ["/og-image.png"], // You can add this later
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#111827" />
        <link rel="canonical" href="https://amp-tracker.vercel.app" />
      </head>
      <body className="bg-gray-900 text-gray-100 font-sans p-2">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
