#pragma once

#include <vector>
#include "core/thermal/ThermalModels.h"
#include "core/thermal/FEMSolver.h"

namespace uew::benchmark {

class ParallelExecutor {
public:
    // Genuine sequential execution loop (T1 baseline - zero threading overhead)
    static void executeSerial(
        const std::vector<uew::thermal::ThermalProblem>& workload,
        std::vector<uew::thermal::ThermalResult>& results);

    // Bounded C++17 worker pool execution for P >= 2 workers
    static void executeParallel(
        const std::vector<uew::thermal::ThermalProblem>& workload,
        int requested_workers,
        std::vector<uew::thermal::ThermalResult>& results);
};

} // namespace uew::benchmark
