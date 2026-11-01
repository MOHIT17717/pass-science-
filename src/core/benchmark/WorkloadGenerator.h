#pragma once

#include <vector>
#include "BenchmarkModels.h"
#include "core/thermal/ThermalModels.h"

namespace uew::benchmark {

class WorkloadGenerator {
public:
    static std::vector<uew::thermal::ThermalProblem> generateWorkload(const BenchmarkConfig& config);
};

} // namespace uew::benchmark
