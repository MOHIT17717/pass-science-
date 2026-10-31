#pragma once
#include "ThermalModels.h"

namespace uew::thermal {
ThermalResult solveSteady1DRod(const ThermalProblem& problem);
double analyticalTemperature(const ThermalProblem& problem, double x_m);
}
