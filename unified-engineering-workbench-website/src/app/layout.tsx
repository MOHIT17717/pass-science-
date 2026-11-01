import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unified Engineering Workbench | Windows 11 x64 Engineering Software",
  description: "Independent multi-domain desktop engineering workbench combining CAD 3D visualization, 2D Thermal FEM simulation, multi-core workload distribution, embedded hardware integration, and neural backpropagation.",
  keywords: ["Engineering Workbench", "CAD Viewer", "Thermal FEM", "Finite Element Method", "Three.js", "C++ Engine", "Multicore Benchmark", "Embedded Hardware"],
  authors: [{ name: "Mohit S K" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
