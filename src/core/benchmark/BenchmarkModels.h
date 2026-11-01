#pragma once

#include <string>
#include <vector>
#include <cstdint>
#include "core/thermal/ThermalModels.h"

namespace uew::benchmark {

struct BenchmarkConfig {
    int case_count = 5000;
    int elements = 80;
    std::vector<int> worker_counts = {1, 2, 4};
    int repetitions = 5;
    uint32_t seed = 12345;
    double k_min = 5.0;
    double k_max = 50.0;
    double q_min = 1000.0;
    double q_max = 50000.0;
    double t_left_min = 50.0;
    double t_left_max = 150.0;
    double t_right_min = 10.0;
    double t_right_max = 50.0;
};

struct EnvironmentInfo {
    std::string cpu_model = "Unknown CPU";
    unsigned int logical_cores = 0;
    unsigned int physical_cores = 0;
    uint64_t total_ram_bytes = 0;
    std::string compiler = "Unknown Compiler";
    std::string build_mode = "Release";
    std::string timer_clock = "std::chrono::steady_clock (QPC)";
    std::string timing_scope = "Compute loop; parallel includes thread spawn, execution, and join; excludes workload generation and JSON/IO";
};

struct WorkerBenchmarkResult {
    int worker_count = 1;
    bool is_serial_baseline = false;
    std::vector<double> repetition_ms; // 5 measured repetition wall times
    double median_ms = 0.0;
    double speedup = 1.0;              // T1 / Tp
    double efficiency = 1.0;           // (T1 / Tp) / p
    double max_discrepancy_vs_serial_C = 0.0;
    bool numerical_agreement_passed = true;
};

struct BenchmarkSuiteResult {
    BenchmarkConfig config;
    EnvironmentInfo environment;
    std::vector<WorkerBenchmarkResult> worker_results;
    double max_global_discrepancy_C = 0.0;
    bool numerical_agreement_passed = true;
    bool all_passed = true;
    std::string notes;
};

} // namespace uew::benchmark
