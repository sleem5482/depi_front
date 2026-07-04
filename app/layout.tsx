import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRIDE Anomaly Detection",
  description: "Real-time IoT sensor anomaly detection — accelerometer, gyroscope & heart-rate streams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
