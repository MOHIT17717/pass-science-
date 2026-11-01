'use client';

import React, { useState } from 'react';
import { Eye, X, ZoomIn, Layers, CheckCircle2 } from 'lucide-react';

export const ScreenshotGallery: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const screenshots = [
    {
      src: '/screenshots/combined_overlay_view.png',
      title: 'Combined CAD & Thermal Overlay',
      category: 'Multi-Physics Integration',
      description: '3D stereolithography mesh aligned with the 2D finite element thermal field, rendering dynamic temperature gradient shaders on the geometry.',
    },
    {
      src: '/screenshots/thermal_results_view.png',
      title: 'Thermal FEM Simulation Results',
      category: 'Thermal FEM Module',
      description: 'Colormap temperature field display, minimum/maximum temperature monitors, and quantitative error analysis compared against synthetic ANSYS benchmarks.',
    },
    {
      src: '/screenshots/performance_results_view.png',
      title: 'Multicore Benchmark Scaling',
      category: 'Concurrency Module',
      description: 'Workload execution benchmarks scaling across 1, 2, and 4 concurrent C++ worker threads with observed speedup curves and Amdahl’s Law projection.',
    },
    {
      src: '/screenshots/hardware_integration_view.png',
      title: 'Embedded Hardware Integration',
      category: 'Embedded Systems Module',
      description: 'UART, SPI, and I2C serial bus emulation streaming live telemetry packets, with active simulated timeout injection and state-machine recovery.',
    },
    {
      src: '/screenshots/backpropagation_results_view.png',
      title: 'Neural Backpropagation Engine',
      category: 'Machine Learning Module',
      description: 'Native C++ gradient descent training curve displaying Mean Squared Error (MSE) convergence over epochs and structured weight matrix outputs.',
    },
    {
      src: '/screenshots/cad_only_view.png',
      title: 'CAD 3D Mesh Inspection',
      category: 'CAD Viewport',
      description: 'Standalone 3D stereolithography (STL) surface mesh rendering with normal vectors, wireframe toggles, and responsive OrbitControls camera controls.',
    },
    {
      src: '/screenshots/temperature_only_view.png',
      title: 'Pure Thermal Colormap Field',
      category: 'Thermal FEM Module',
      description: 'Direct 2D scalar temperature distribution computed from the steady-state heat equation without CAD surface obstruction.',
    },
    {
      src: '/screenshots/node_inspection_view.png',
      title: 'Interactive Node Temperature Probe',
      category: 'Inspection & Diagnostics',
      description: 'Point-and-click coordinate inspection probing individual finite element nodes to reveal exact spatial coordinates (X, Y) and calculated temperatures.',
    },
  ];

  return (
    <section id="gallery" className="py-24 bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-mono font-semibold rounded mb-3">
            VERIFIED APPLICATION CAPTURES
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Application Screenshot Gallery
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            All eight screenshots below were captured directly from the verified standalone Windows 11 executable (<code className="text-cyan-400 font-mono text-xs">Launch.exe</code>). Click any capture to open the high-resolution lightbox.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {screenshots.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className="group bg-slate-950 border border-slate-800 rounded-xl overflow-hidden cursor-pointer hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-950/20 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="p-2.5 rounded-full bg-cyan-500 text-white shadow-lg">
                      <ZoomIn className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-[10px] font-mono font-semibold text-cyan-400">
                    {item.category}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="px-4 py-2.5 bg-slate-900/40 border-t border-slate-850 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Figure {idx + 1} of 8</span>
                <span className="text-cyan-400 flex items-center gap-1 group-hover:underline">
                  <Eye className="w-3.5 h-3.5" /> Enlarge
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {selectedImage !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 lg:p-10 animate-in fade-in duration-200"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="relative max-w-5xl w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-cyan-400 font-semibold uppercase">
                    {screenshots[selectedImage].category} • Figure {selectedImage + 1} of 8
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {screenshots[selectedImage].title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Image */}
              <div className="bg-slate-950 aspect-[16/10] max-h-[70vh] flex items-center justify-center p-2">
                <img
                  src={screenshots[selectedImage].src}
                  alt={screenshots[selectedImage].title}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>

              {/* Modal Footer Description */}
              <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <p className="text-slate-300 leading-relaxed max-w-3xl">
                  {screenshots[selectedImage].description}
                </p>
                <div className="shrink-0 font-mono text-emerald-400 flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified Clean-Machine Capture</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

