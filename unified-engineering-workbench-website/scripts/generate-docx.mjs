import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  ShadingType,
} from 'docx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const outputPath = path.resolve(projectRoot, 'docs/INSTALLATION_AND_EXECUTION_GUIDE.docx');

// Design Palette
const COLOR_PRIMARY = '0284C7'; // Cyan/Sky blue
const COLOR_DARK = '0F172A';    // Slate 900
const COLOR_MUTED = '475569';   // Slate 600
const COLOR_BORDER = 'CBD5E1';  // Slate 300
const COLOR_BG_LIGHT = 'F8FAFC';// Slate 50
const COLOR_CODE_BG = 'F1F5F9'; // Slate 100
const FONT_SANS = 'Segoe UI';
const FONT_MONO = 'Consolas';

function createHeading(text, subtitleText = '') {
  return [
    new Paragraph({
      spacing: { before: 120, after: 40 },
      children: [
        new TextRun({
          text,
          bold: true,
          size: 22, // 11pt
          color: COLOR_DARK,
          font: FONT_SANS,
        }),
      ],
    }),
  ];
}

function createSubheading(text) {
  return new Paragraph({
    spacing: { before: 80, after: 30 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 19, // 9.5pt
        color: COLOR_PRIMARY,
        font: FONT_SANS,
      }),
    ],
  });
}

function createBody(text, boldPrefix = '', isBullet = false) {
  const children = [];
  if (boldPrefix) {
    children.push(
      new TextRun({
        text: boldPrefix,
        bold: true,
        size: 17, // 8.5pt
        color: COLOR_DARK,
        font: FONT_SANS,
      })
    );
  }
  children.push(
    new TextRun({
      text,
      size: 17, // 8.5pt
      color: COLOR_DARK,
      font: FONT_SANS,
    })
  );

  return new Paragraph({
    bullet: isBullet ? { level: 0 } : undefined,
    spacing: { before: 20, after: 30 },
    children,
  });
}

function createCodeBlock(lines) {
  const children = lines.map((line, idx) => {
    return new TextRun({
      text: line + (idx < lines.length - 1 ? '\n' : ''),
      font: FONT_MONO,
      size: 15, // 7.5pt
      color: '0F172A',
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 12, color: COLOR_PRIMARY },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLOR_CODE_BG, type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                spacing: { before: 20, after: 20 },
                children,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createCallout(boldTitle, text, isAmber = false) {
  const borderColor = isAmber ? 'D97706' : COLOR_PRIMARY;
  const bgColor = isAmber ? 'FEF3C7' : 'F0F9FF';

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
      left: { style: BorderStyle.SINGLE, size: 16, color: borderColor },
      right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: bgColor, type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                spacing: { before: 20, after: 20 },
                children: [
                  new TextRun({
                    text: boldTitle + ' ',
                    bold: true,
                    size: 16, // 8pt
                    color: isAmber ? '92400E' : '0369A1',
                    font: FONT_SANS,
                  }),
                  new TextRun({
                    text,
                    size: 16,
                    color: isAmber ? '78350F' : '0C4A6E',
                    font: FONT_SANS,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// ----------------------------------------------------
// BUILD DOCUMENT
// ----------------------------------------------------

console.log('[DOCX] Generating 2-Page Executive Installation & Execution Guide...');

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT_SANS, size: 17, color: COLOR_DARK },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 580, bottom: 580, left: 620, right: 620 }, // ~0.43 in margins to guarantee exact 2-page fit
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: 'Unified Engineering Workbench • Executive Installation & Execution Guide',
                  size: 14,
                  color: COLOR_MUTED,
                  font: FONT_SANS,
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.SPACE_BETWEEN,
              children: [
                new TextRun({
                  text: 'Author: Mohit S K (SRMIST) • mohit17717@gmail.com',
                  size: 14,
                  color: COLOR_MUTED,
                  font: FONT_SANS,
                }),
                new TextRun({
                  text: 'Page ',
                  size: 14,
                  color: COLOR_MUTED,
                  font: FONT_SANS,
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 14,
                  color: COLOR_MUTED,
                  font: FONT_SANS,
                }),
                new TextRun({
                  text: ' of ',
                  size: 14,
                  color: COLOR_MUTED,
                  font: FONT_SANS,
                }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  size: 14,
                  color: COLOR_MUTED,
                  font: FONT_SANS,
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        // =====================================================================
        // PAGE 1: STANDALONE ZERO-PREREQUISITE QUICK START
        // =====================================================================
        new Paragraph({
          spacing: { before: 0, after: 20 },
          children: [
            new TextRun({
              text: 'UNIFIED ENGINEERING WORKBENCH',
              bold: true,
              size: 28, // 14pt
              color: COLOR_DARK,
              font: FONT_SANS,
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 0, after: 40 },
          children: [
            new TextRun({
              text: 'Installation, Build & Execution Guide (2-Page Concise Reference)',
              bold: true,
              size: 18, // 9pt
              color: COLOR_PRIMARY,
              font: FONT_SANS,
            }),
          ],
        }),

        // Author meta bar
        new Paragraph({
          spacing: { before: 0, after: 100 },
          children: [
            new TextRun({ text: 'Author: ', bold: true, size: 16, color: COLOR_MUTED }),
            new TextRun({ text: 'Mohit S K • SRM Institute of Science and Technology (2023–2027)  |  ', size: 16, color: COLOR_MUTED }),
            new TextRun({ text: 'Email: ', bold: true, size: 16, color: COLOR_MUTED }),
            new TextRun({ text: 'mohit17717@gmail.com / ms1131@srmist.edu.in\n', size: 16, color: COLOR_MUTED }),
            new TextRun({ text: 'Repository: ', bold: true, size: 16, color: COLOR_MUTED }),
            new TextRun({ text: 'https://github.com/MOHIT17717/pass-science-.git  |  ', size: 16, color: COLOR_MUTED }),
            new TextRun({ text: 'Release: ', bold: true, size: 16, color: COLOR_MUTED }),
            new TextRun({ text: 'v1.0.0 Standalone (Windows 11 x64)', size: 16, color: COLOR_MUTED }),
          ],
        }),

        createSubheading('PART 1: Fast-Track Standalone Execution (Evaluator / End-User Mode)'),
        createBody(
          'The standalone distribution is completely portable and self-contained. It runs immediately on clean Windows 11/10 64-bit systems with zero external dependencies (no Node.js, CMake, Visual Studio, Python, compilers, or administrative elevation required).'
        ),

        createSubheading('1.1 Download Package & Verify Integrity'),
        createBody(' CandidateID_Workbench.zip (154.7 MB / 162,204,375 bytes)', '• Archive Name:', false),
        createBody(' https://jcafrzfdr7rjkbxw.public.blob.vercel-storage.com/CandidateID_Workbench.zip?download=1', '• Download Link:', false),
        createBody(' 01EF5F8BC6D8DC3597D8DD918991540E686ACF5B449F7A1284C8A9DD453C67A0', '• SHA-256 Hash:', false),
        createBody('Get-FileHash -Path ".\\CandidateID_Workbench.zip" -Algorithm SHA256', '• Integrity Verify (PowerShell): ', false),

        createSubheading('1.2 Running the Application (3 Steps)'),
        createBody('Right-click CandidateID_Workbench.zip and select "Extract All..." to any local directory (e.g. C:\\Engineering\\Workbench\\ or Desktop). Uncompressed footprint: ~340 MB.', '1. Extract: '),
        createBody('Open the extracted folder and double-click Launch.exe. The application automatically starts in standard unprivileged user space.', '2. Launch: '),
        createBody('Because this independent build is not signed with an enterprise EV certificate, Windows 11 may show "Windows protected your PC". Click "More info", then click "Run anyway".', '3. SmartScreen: '),

        createCallout(
          'Automated Startup Sequence:',
          'Launch.exe allocates an ephemeral loopback socket on 127.0.0.1, generates a random 256-bit authentication token, spawns the compiled native C++ engine (bin/uew_backend.exe), and initializes the hardware-accelerated user interface.'
        ),

        createSubheading('1.3 In-App Module Verification Checklist'),
        createBody('Click "Load Sample Bracket" -> Inspect 3D WebGL mesh rendering with OrbitControls (drag to rotate, right-click to pan, scroll to zoom).', '• CAD 3D Viewport: ', false),
        createBody('Click "Run Simulation" -> Observe 2D heat equation field convergence, gradient colormap, and synthetic ANSYS comparison metrics (L2 error norm, Pearson r > 0.99).', '• Thermal FEM Solver: ', false),
        createBody('Select 500k workload -> Click "Run Benchmark" -> Observe execution time scaling across 1, 2, and 4 concurrent C++ worker threads with Amdahl’s Law speedup curves.', '• Multicore Concurrency: ', false),
        createBody('Select UART/SPI/I2C -> Click "Connect Bus" -> Observe streaming telemetry packets. Click "Inject Timeout Fault" -> Verify automatic state-machine recovery.', '• Hardware Mock Bus: ', false),
        createBody('Click "Start Training" -> Observe real-time MSE loss curve descent computed in native C++. Click "Export Weights CSV" to download trained weight matrices.', '• Neural Backpropagation: ', false),
        createBody('Close the window or press Alt + F4 -> C++ backend receives shutdown token and terminates with zero orphaned processes.', '• Graceful Exit: ', false),

        // =====================================================================
        // PAGE BREAK FOR EXACT 2-PAGE LAYOUT
        // =====================================================================
        new Paragraph({
          children: [new PageBreak()],
        }),

        // =====================================================================
        // PAGE 2: DEVELOPER SCRATCH BUILD FROM SOURCE CODE
        // =====================================================================
        createSubheading('PART 2: Complete Developer Build from Scratch (Source-to-Binary Pipeline)'),
        createBody(
          'Follow these instructions to compile, link, and package the complete project from clean source code on Windows 11 x64.'
        ),

        createSubheading('2.1 Developer Toolchain Prerequisites'),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
                  margins: { top: 40, bottom: 40, left: 60, right: 60 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Component', bold: true, size: 16 })] })],
                }),
                new TableCell({
                  shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
                  margins: { top: 40, bottom: 40, left: 60, right: 60 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Minimum Specification', bold: true, size: 16 })] })],
                }),
                new TableCell({
                  shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
                  margins: { top: 40, bottom: 40, left: 60, right: 60 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Verification Command', bold: true, size: 16 })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ margins: { top: 30, bottom: 30, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: 'Operating System', size: 15, bold: true })] })] }),
                new TableCell({ margins: { top: 30, bottom: 30, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: 'Windows 11 / 10 64-bit (x86-64)', size: 15 })] })] }),
                new TableCell({ margins: { top: 30, bottom: 30, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: '[System.Environment]::OSVersion', font: FONT_MONO, size: 14 })] })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ margins: { top: 30, bottom: 30, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: 'C++ Toolchain', size: 15, bold: true })] })] }),
                new TableCell({ margins: { top: 30, bottom: 30, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: 'MSVC v143 (Visual Studio 2022 Build Tools)', size: 15 })] })] }),
                new TableCell({ margins: { top: 30, bottom: 30, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: 'cl.exe', font: FONT_MONO, size: 14 })] })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ margins: { top: 30, bottom: 30, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: 'Build System', size: 15, bold: true })] })] }),
                new TableCell({ margins: { top: 30, bottom: 30, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: 'CMake 3.20 or newer', size: 15 })] })] }),
                new TableCell({ margins: { top: 30, bottom: 30, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: 'cmake --version', font: FONT_MONO, size: 14 })] })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ margins: { top: 30, bottom: 30, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: 'JavaScript Runtime', size: 15, bold: true })] })] }),
                new TableCell({ margins: { top: 30, bottom: 30, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: 'Node.js v20.x or v22.x LTS & npm 10+', size: 15 })] })] }),
                new TableCell({ margins: { top: 30, bottom: 30, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: 'node -v; npm -v', font: FONT_MONO, size: 14 })] })] }),
              ],
            }),
          ],
        }),

        createSubheading('2.2 Step-by-Step Scratch Build Sequence (PowerShell)'),
        createCodeBlock([
          '# 1. Clone repository and enter project root',
          'git clone https://github.com/MOHIT17717/pass-science-.git',
          'cd pass-science-',
          '',
          '# 2. Configure and compile native C++17 engineering backend',
          'cmake -B build -S . -DCMAKE_BUILD_TYPE=Release',
          'cmake --build build --config Release',
          '',
          '# 3. Install Electron & React dependencies (from local cache / registry)',
          'npm install',
          '',
          '# 4. Run native numerical verification tests (FEM solver check)',
          '.\\build\\Release\\test_fem.exe',
          '',
          '# 5. Launch application in development mode',
          'npm start',
        ]),

        createSubheading('2.3 Standalone Packaging Pipeline (Producing CandidateID_Workbench.zip)'),
        createBody(
          'To reproduce the standalone ZIP package with bundled MSVC runtime DLLs and Launch.exe:'
        ),
        createCodeBlock([
          '# Compile Electron production bundle and package standalone release tree',
          'npm run build',
          'npm run package:standalone',
          '',
          '# Standalone distribution artifacts are produced in: release/',
          '# -> release/CandidateID_Workbench/      (uncompressed folder)',
          '# -> release/CandidateID_Workbench.zip   (standalone ZIP archive)',
        ]),

        createSubheading('2.4 Architectural Safety & Troubleshooting'),
        createBody('The C++ engine strictly binds to 127.0.0.1 on an ephemeral port. It will never request firewall inbound rules or make remote internet calls.', '• Local Loopback Only: ', false),
        createBody('If the default port is occupied, Launch.exe automatically selects the next available ephemeral port.', '• Port Conflict Resolution: ', false),
        createBody('Required MSVC runtimes (vcruntime140.dll, msvcp140.dll) are bundled in bin/ alongside uew_backend.exe.', '• Bundled MSVC Runtime: ', false),
        createBody('Core FEM solver sources (FEMSolver.cpp, FEMSolver.h, ThermalModels.h, test_fem.cpp) match verified baseline SHA-256 hashes byte-for-byte.', '• Solver Integrity: ', false),
      ],
    },
  ],
});

// Pack to file
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`[DOCX] Successfully generated 2-page Word document at: ${outputPath}`);
  console.log(`[DOCX] File size: ${buffer.length} bytes`);
});
