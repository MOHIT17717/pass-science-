#include "FEMSolver.h"
#include <cmath>
#include <stdexcept>
#include <algorithm>

namespace uew::thermal {
namespace {
std::vector<double> solveDense(std::vector<std::vector<double>> a,
                               std::vector<double> b) {
    const std::size_t n = b.size();
    for (std::size_t col = 0; col < n; ++col) {
        std::size_t pivot = col;
        for (std::size_t row = col + 1; row < n; ++row)
            if (std::abs(a[row][col]) > std::abs(a[pivot][col])) pivot = row;
        if (std::abs(a[pivot][col]) < 1e-18)
            throw std::runtime_error("Singular FEM stiffness matrix.");
        std::swap(a[pivot], a[col]);
        std::swap(b[pivot], b[col]);
        const double d = a[col][col];
        for (std::size_t j = col; j < n; ++j) a[col][j] /= d;
        b[col] /= d;
        for (std::size_t row = 0; row < n; ++row) {
            if (row == col) continue;
            const double factor = a[row][col];
            for (std::size_t j = col; j < n; ++j)
                a[row][j] -= factor * a[col][j];
            b[row] -= factor * b[col];
        }
    }
    return b;
}
}

double analyticalTemperature(const ThermalProblem& p, double x) {
    const double linear = p.left_temperature_C +
        (p.right_temperature_C - p.left_temperature_C) * x / p.length_m;
    return linear + (p.generation_W_m3 / (2.0 * p.conductivity_W_mK)) *
        x * (p.length_m - x);
}

ThermalResult solveSteady1DRod(const ThermalProblem& p) {
    if (!(p.length_m > 0.0) || !(p.area_m2 > 0.0) ||
        !(p.conductivity_W_mK > 0.0) || p.elements < 1 ||
        !std::isfinite(p.generation_W_m3) ||
        !std::isfinite(p.left_temperature_C) ||
        !std::isfinite(p.right_temperature_C))
        throw std::invalid_argument("Thermal problem contains invalid parameters.");

    const int nodeCount = p.elements + 1;
    const double le = p.length_m / p.elements;
    const double factor = p.conductivity_W_mK * p.area_m2 / le;
    const double load = p.generation_W_m3 * p.area_m2 * le / 2.0;

    std::vector<std::vector<double>> K(nodeCount,
                                       std::vector<double>(nodeCount, 0.0));
    std::vector<double> F(nodeCount, 0.0);

    for (int e = 0; e < p.elements; ++e) {
        const int i = e, j = e + 1;
        K[i][i] += factor; K[i][j] -= factor;
        K[j][i] -= factor; K[j][j] += factor;
        F[i] += load; F[j] += load;
    }

    // Apply prescribed temperatures by elimination, preserving their
    // contributions to the right-hand side of the free equations.
    const auto applyDirichlet = [&](int node, double value) {
        for (int row = 0; row < nodeCount; ++row) {
            if (row == node) continue;
            F[row] -= K[row][node] * value;
            K[row][node] = 0.0;
        }
        std::fill(K[node].begin(), K[node].end(), 0.0);
        K[node][node] = 1.0;
        F[node] = value;
    };
    applyDirichlet(0, p.left_temperature_C);
    applyDirichlet(nodeCount - 1, p.right_temperature_C);

    ThermalResult result;
    result.temperature_C = solveDense(std::move(K), std::move(F));
    result.x_m.resize(nodeCount);
    for (int i = 0; i < nodeCount; ++i)
        result.x_m[i] = i * le;

    // Linear FE interpolation at each element midpoint.
    for (int e = 0; e < p.elements; ++e) {
        const double xmid = (e + 0.5) * le;
        const double feMid = 0.5 * (result.temperature_C[e] +
                                    result.temperature_C[e + 1]);
        result.max_midpoint_error_C = std::max(
            result.max_midpoint_error_C,
            std::abs(feMid - analyticalTemperature(p, xmid)));
    }
    return result;
}
}
