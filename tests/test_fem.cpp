#include "core/thermal/FEMSolver.h"
#include <cmath>
#include <iostream>
#include <stdexcept>

static void require(bool condition, const char* message) {
    if (!condition) throw std::runtime_error(message);
}

int main() {
    try {
        uew::thermal::ThermalProblem p;
        p.elements = 10;
        const auto r10 = uew::thermal::solveSteady1DRod(p);
        require(r10.temperature_C.size() == 11, "Expected 11 nodal temperatures");
        require(std::abs(r10.temperature_C.front() - 100.0) < 1e-10,
                "Left boundary condition incorrect");
        require(std::abs(r10.temperature_C.back() - 20.0) < 1e-10,
                "Right boundary condition incorrect");

        double previousError = r10.max_midpoint_error_C;
        for (int n : {20, 40, 80}) {
            p.elements = n;
            const auto r = uew::thermal::solveSteady1DRod(p);
            require(r.max_midpoint_error_C < previousError,
                    "Midpoint error should decrease under mesh refinement");
            previousError = r.max_midpoint_error_C;
        }
        require(previousError < 0.02, "80-element midpoint error unexpectedly high");

        bool rejected = false;
        try { p.elements = 0; (void)uew::thermal::solveSteady1DRod(p); }
        catch (const std::invalid_argument&) { rejected = true; }
        require(rejected, "Invalid element count was not rejected");

        std::cout << "PASS: FEM boundary conditions, convergence and validation\\n";
        std::cout << "80-element maximum midpoint error: "
                  << previousError << " C\\n";
        return 0;
    } catch (const std::exception& ex) {
        std::cerr << "FAIL: " << ex.what() << '\n';
        return 1;
    }
}
