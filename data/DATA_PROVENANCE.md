# Dataset Provenance and Schema Specification

## 1. Overview

This directory contains reference datasets used by the Unified Engineering Workbench (UEW) for geometry parsing, thermal data parsing, and 3D visualization verification.

In strict compliance with project engineering boundaries:
- **No proprietary or synthetic data is misrepresented.**
- Synthetic datasets are explicitly marked as synthetic and are not claimed to be native or exported ANSYS files.
- All file formats follow open, human-readable specifications (ASCII STL and standard CSV).

---

## 2. Reference CAD Geometry: `sample_bracket.stl`

- **File Path**: `data/cad/sample_bracket.stl`
- **Format**: ASCII Stereolithography (STL), ANSI/IEEE standards.
- **Provenance**: Created specifically for this project as an open-source geometric benchmark.
- **License**: CC0 1.0 Universal / Public Domain.
- **Topology**:
  - Closed manifold 3D block / mounting bracket geometry.
  - Facet Count: 12 triangles (2 triangles per rectangular face across 6 faces).
  - Vertex Count: 36 vertices (3 vertices per facet, unindexed).
- **Physical Dimensions & Units**:
  - Units: Meters ($m$).
  - Coordinate Range:
    - $X \in [0.000, 0.100]\ \text{m}$ ($100\ \text{mm}$)
    - $Y \in [0.000, 0.100]\ \text{m}$ ($100\ \text{mm}$)
    - $Z \in [0.000, 0.050]\ \text{m}$ ($50\ \text{mm}$)
  - Volume: $0.100 \times 0.100 \times 0.050 = 0.0005\ \text{m}^3 = 500\ \text{cm}^3$.
- **Validation Criteria**:
  - Right-hand rule normal orientation (outward-pointing unit normals).
  - Explicit outward facet normals provided; degenerate normals fallback to cross-product recomputation.
  - Passes strict ASCII grammar validation, 0-triangle checks, and finite coordinate checks.

---

## 3. Thermal Point Cloud: `synthetic_temperature_point_cloud.csv`

- **File Path**: `data/ansys/synthetic_temperature_point_cloud.csv`
- **Format**: Comma-Separated Values (CSV), RFC 4180 compliant with UTF-8 character encoding.
- **Provenance & Engineering Disclaimer**:
  - **DISCLAIMER**: This dataset is **SYNTHETIC**. It was generated numerically using an analytical 3D steady-state thermal distribution over a discrete point grid.
  - **IT IS NOT AN ACTUAL ANSYS EXPORT.** UEW does not interface with proprietary ANSYS binaries or native `.cdb` / `.rst` files.
  - Provenance metadata is embedded directly into the file header comments (`#`).
- **License**: CC0 1.0 Universal / Public Domain.
- **Schema**:
  ```csv
  node_id,x_m,y_m,z_m,temperature_C
  ```
  - `node_id`: Non-negative 64-bit integer (`int64_t`), uniquely identifying each spatial measurement node.
  - `x_m`: Node position in $X$ coordinate, floating-point, in meters ($m$).
  - `y_m`: Node position in $Y$ coordinate, floating-point, in meters ($m$).
  - `z_m`: Node position in $Z$ coordinate, floating-point, in meters ($m$).
  - `temperature_C`: Measured or simulated scalar temperature at the node, floating-point, in degrees Celsius ($^\circ\text{C}$).
- **Topology & Spatial Sampling**:
  - Grid Resolution: $5 \times 5 \times 5 = 125$ distinct spatial sampling nodes.
  - Coordinate Range:
    - $X \in [0.000, 0.100]\ \text{m}$ (step: $0.025\ \text{m}$)
    - $Y \in [0.000, 0.100]\ \text{m}$ (step: $0.025\ \text{m}$)
    - $Z \in [0.000, 0.050]\ \text{m}$ (step: $0.0125\ \text{m}$)
- **Analytical Field Function & Statistics**:
  - Minimum Temperature: $10.0000\ ^\circ\text{C}$.
  - Maximum Temperature: $165.0000\ ^\circ\text{C}$.
  - Average Temperature: $\approx 107.4142\ ^\circ\text{C}$.
- **Validation Criteria**:
  - Exact header match (`node_id,x_m,y_m,z_m,temperature_C`).
  - Strict uniqueness of `node_id` values ($1$ to $125$).
  - Physical temperature boundary check ($T \ge -273.15\ ^\circ\text{C}$).
  - All numerical values are strictly finite.
