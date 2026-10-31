#pragma once
#include <vector>

namespace uew::thermal {
struct ThermalProblem {
    double length_m = 1.0;
    double area_m2 = 1.0e-4;
    double conductivity_W_mK = 10.0;
    double generation_W_m3 = 10000.0;
    double left_temperature_C = 100.0;
    double right_temperature_C = 20.0;
    int elements = 10;
};

struct ThermalResult {
    std::vector<double> x_m;
    std::vector<double> temperature_C;
    double max_midpoint_error_C = 0.0;
};

double analyticalTemperature(const ThermalProblem& problem, double x_m);
ThermalResult solveSteady1DRod(const ThermalProblem& problem);
}
