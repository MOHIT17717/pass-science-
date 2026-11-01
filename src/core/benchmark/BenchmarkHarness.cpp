#include "BenchmarkHarness.h"
#include "EnvironmentHelper.h"
#include "WorkloadGenerator.h"
#include "ParallelExecutor.h"
#include <chrono>
#include <algorithm>
#include <cmath>
#include <sstream>
#include <iomanip>

namespace uew::benchmark {

namespace {

double calculateMedian(const std::vector<double>& values) {
    if (values.empty()) return 0.0;
    std::vector<double> sorted = values;
    std::sort(sorted.begin(), sorted.end());
    const size_t n = sorted.size();
    if (n % 2 == 1) {
        return sorted[n / 2];
    } else {
        return (sorted[n / 2 - 1] + sorted[n / 2]) / 2.0;
    }
}

} // namespace

BenchmarkSuiteResult BenchmarkHarness::runSuite(const BenchmarkConfig& config) {
    BenchmarkSuiteResult suite;
    suite.config = config;
    suite.environment = detectEnvironment();
    suite.all_passed = true;
    suite.numerical_agreement_passed = true;
    suite.max_global_discrepancy_C = 0.0;

    // 1. Generate deterministic workload
    const auto workload = WorkloadGenerator::generateWorkload(config);
    const size_t total_cases = workload.size();

    // 2. Serial Baseline (T1)
    std::vector<uew::thermal::ThermalResult> serial_results;

    // Warm-up run (unmeasured) to prime CPU cache and stabilize frequency scaling
    ParallelExecutor::executeSerial(workload, serial_results);

    WorkerBenchmarkResult serial_res;
    serial_res.worker_count = 1;
    serial_res.is_serial_baseline = true;
    serial_res.repetition_ms.reserve(config.repetitions);

    for (int r = 0; r < config.repetitions; ++r) {
        auto t0 = std::chrono::steady_clock::now();
        ParallelExecutor::executeSerial(workload, serial_results);
        auto t1 = std::chrono::steady_clock::now();
        double ms = std::chrono::duration<double, std::milli>(t1 - t0).count();
        serial_res.repetition_ms.push_back(ms);
    }

    const double t1_median = calculateMedian(serial_res.repetition_ms);
    serial_res.median_ms = t1_median;
    serial_res.speedup = 1.0;
    serial_res.efficiency = 1.0;
    serial_res.max_discrepancy_vs_serial_C = 0.0;
    serial_res.numerical_agreement_passed = true;

    suite.worker_results.push_back(serial_res);

    // 3. Parallel Worker Counts
    std::vector<int> parallel_workers;
    for (int w : config.worker_counts) {
        if (w > 1) {
            // Cap at hardware concurrency
            int capped_w = std::min(w, static_cast<int>(suite.environment.logical_cores));
            if (std::find(parallel_workers.begin(), parallel_workers.end(), capped_w) == parallel_workers.end()) {
                parallel_workers.push_back(capped_w);
            }
        }
    }
    std::sort(parallel_workers.begin(), parallel_workers.end());

    for (int p : parallel_workers) {
        WorkerBenchmarkResult p_res;
        p_res.worker_count = p;
        p_res.is_serial_baseline = false;
        p_res.repetition_ms.reserve(config.repetitions);

        std::vector<uew::thermal::ThermalResult> parallel_results;

        // Warm-up run
        ParallelExecutor::executeParallel(workload, p, parallel_results);

        // 5 Measured repetitions
        for (int r = 0; r < config.repetitions; ++r) {
            auto t0 = std::chrono::steady_clock::now();
            ParallelExecutor::executeParallel(workload, p, parallel_results);
            auto t1 = std::chrono::steady_clock::now();
            double ms = std::chrono::duration<double, std::milli>(t1 - t0).count();
            p_res.repetition_ms.push_back(ms);
        }

        const double tp_median = calculateMedian(p_res.repetition_ms);
        p_res.median_ms = tp_median;
        p_res.speedup = (tp_median > 0.0) ? (t1_median / tp_median) : 0.0;
        p_res.efficiency = (p > 0) ? (p_res.speedup / static_cast<double>(p)) : 0.0;

        // Strict numerical validation against serial baseline for every case and every node
        double max_diff = 0.0;
        if (parallel_results.size() != total_cases) {
            p_res.numerical_agreement_passed = false;
            suite.all_passed = false;
        } else {
            for (size_t i = 0; i < total_cases; ++i) {
                const auto& s_case = serial_results[i];
                const auto& p_case = parallel_results[i];

                if (s_case.temperature_C.size() != p_case.temperature_C.size()) {
                    p_res.numerical_agreement_passed = false;
                    suite.all_passed = false;
                    break;
                }

                for (size_t j = 0; j < s_case.temperature_C.size(); ++j) {
                    double diff = std::abs(s_case.temperature_C[j] - p_case.temperature_C[j]);
                    if (diff > max_diff) {
                        max_diff = diff;
                    }
                }
            }
        }

        p_res.max_discrepancy_vs_serial_C = max_diff;
        p_res.numerical_agreement_passed = (max_diff <= 1.0e-8);

        if (!p_res.numerical_agreement_passed) {
            suite.numerical_agreement_passed = false;
            suite.all_passed = false;
        }

        if (max_diff > suite.max_global_discrepancy_C) {
            suite.max_global_discrepancy_C = max_diff;
        }

        suite.worker_results.push_back(p_res);
    }

    std::ostringstream oss;
    oss << "Workload: " << total_cases << " cases, " << config.elements << " elements. "
        << "Timing scope: wall-clock compute interval. Parallel mode includes worker spawn, execution, and join. "
        << "Max global discrepancy: " << suite.max_global_discrepancy_C << " degC (threshold: <= 1e-8 degC).";
    suite.notes = oss.str();

    return suite;
}

std::string BenchmarkHarness::exportBenchmarkCsv(const BenchmarkSuiteResult& suite) {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(6);

    // Metadata comments
    oss << "# Unified Engineering Workbench - Multicore Benchmark Export\n";
    oss << "# CPU Model: " << suite.environment.cpu_model << "\n";
    oss << "# Logical Cores: " << suite.environment.logical_cores
        << " | Physical Cores: " << suite.environment.physical_cores
        << " | Total RAM: " << suite.environment.total_ram_bytes << " bytes\n";
    oss << "# Compiler: " << suite.environment.compiler
        << " | Build Mode: " << suite.environment.build_mode << "\n";
    oss << "# Timer Clock: " << suite.environment.timer_clock << "\n";
    oss << "# Timing Scope: " << suite.environment.timing_scope << "\n";
    oss << "# Workload: cases=" << suite.config.case_count
        << ", elements=" << suite.config.elements
        << ", seed=" << suite.config.seed << "\n";
    oss << "# Numerical Agreement Threshold: <= 1.0e-8 degC (Max Observed: "
        << suite.max_global_discrepancy_C << " degC)\n";
    oss << "# Status: " << (suite.all_passed ? "PASS" : "FAIL") << "\n";

    // Column headers
    oss << "worker_count,is_serial,rep1_ms,rep2_ms,rep3_ms,rep4_ms,rep5_ms,median_ms,speedup,efficiency,max_discrepancy_C,numerical_pass\n";

    for (const auto& w : suite.worker_results) {
        oss << w.worker_count << ","
            << (w.is_serial_baseline ? "true" : "false") << ",";

        for (size_t r = 0; r < 5; ++r) {
            if (r < w.repetition_ms.size()) {
                oss << std::setprecision(3) << w.repetition_ms[r];
            } else {
                oss << "0.000";
            }
            oss << ",";
        }

        oss << std::setprecision(3) << w.median_ms << ","
            << std::setprecision(4) << w.speedup << ","
            << std::setprecision(4) << w.efficiency << ","
            << std::scientific << std::setprecision(6) << w.max_discrepancy_vs_serial_C << ","
            << (w.numerical_agreement_passed ? "PASS" : "FAIL") << "\n";
    }

    return oss.str();
}

} // namespace uew::benchmark
