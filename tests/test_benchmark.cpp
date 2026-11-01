#include <iostream>
#include <cassert>
#include <cmath>
#include <stdexcept>
#include <string>
#include "core/benchmark/BenchmarkModels.h"
#include "core/benchmark/EnvironmentHelper.h"
#include "core/benchmark/WorkloadGenerator.h"
#include "core/benchmark/ParallelExecutor.h"
#include "core/benchmark/BenchmarkHarness.h"

#define TEST_ASSERT(cond, msg) \
    do { \
        if (!(cond)) { \
            std::cerr << "[TEST FAILURE] " << (msg) << " (" << __FILE__ << ":" << __LINE__ << ")\n"; \
            std::exit(1); \
        } \
    } while (0)

using namespace uew::benchmark;

void test_workload_generator() {
    std::cout << "[RUNNING] Workload Generator - Determinism and Parameter Validation... ";

    BenchmarkConfig cfg1;
    cfg1.case_count = 50;
    cfg1.elements = 20;
    cfg1.seed = 42;

    auto cases1 = WorkloadGenerator::generateWorkload(cfg1);
    TEST_ASSERT(cases1.size() == 50, "Generated exactly 50 cases");
    TEST_ASSERT(cases1[0].elements == 20, "Elements match config");
    TEST_ASSERT(cases1[0].area_m2 == 1.0e-4, "Cross-sectional area is 0.0001 m^2");

    // Same seed must produce bitwise identical workload
    auto cases2 = WorkloadGenerator::generateWorkload(cfg1);
    TEST_ASSERT(cases2.size() == 50, "Identical case count");
    for (size_t i = 0; i < cases1.size(); ++i) {
        TEST_ASSERT(cases1[i].conductivity_W_mK == cases2[i].conductivity_W_mK, "Identical k");
        TEST_ASSERT(cases1[i].generation_W_m3 == cases2[i].generation_W_m3, "Identical q");
        TEST_ASSERT(cases1[i].left_temperature_C == cases2[i].left_temperature_C, "Identical T_left");
        TEST_ASSERT(cases1[i].right_temperature_C == cases2[i].right_temperature_C, "Identical T_right");
    }

    // Different seed must produce different workload
    BenchmarkConfig cfg3 = cfg1;
    cfg3.seed = 999;
    auto cases3 = WorkloadGenerator::generateWorkload(cfg3);
    TEST_ASSERT(cases1[0].conductivity_W_mK != cases3[0].conductivity_W_mK, "Different seed changes k");

    // Invalid parameters must throw invalid_argument
    BenchmarkConfig bad_cfg = cfg1;
    bad_cfg.case_count = 0;
    try {
        WorkloadGenerator::generateWorkload(bad_cfg);
        TEST_ASSERT(false, "Should throw on case_count <= 0");
    } catch (const std::invalid_argument&) {
        // Expected
    }

    bad_cfg = cfg1;
    bad_cfg.k_min = -1.0;
    try {
        WorkloadGenerator::generateWorkload(bad_cfg);
        TEST_ASSERT(false, "Should throw on k_min <= 0");
    } catch (const std::invalid_argument&) {
        // Expected
    }

    std::cout << "PASSED\n";
}

void test_environment_helper() {
    std::cout << "[RUNNING] Environment Helper - Hardware & Build Metadata Detection... ";

    auto env = detectEnvironment();
    TEST_ASSERT(!env.cpu_model.empty(), "CPU model detected");
    TEST_ASSERT(env.logical_cores >= 1, "At least 1 logical core detected");
    TEST_ASSERT(env.physical_cores >= 1, "At least 1 physical core detected");
    TEST_ASSERT(env.total_ram_bytes > 0, "RAM detected");
    TEST_ASSERT(!env.compiler.empty(), "Compiler detected");
    TEST_ASSERT(!env.build_mode.empty(), "Build mode detected");
    TEST_ASSERT(!env.timer_clock.empty(), "Timer clock documented");

    std::cout << "PASSED (" << env.cpu_model << ", " << env.logical_cores << " logical cores)\n";
}

void test_parallel_numerical_agreement() {
    std::cout << "[RUNNING] Parallel Executor - Serial vs Parallel Numerical Agreement (<= 1e-8 C)... ";

    BenchmarkConfig cfg;
    cfg.case_count = 100;
    cfg.elements = 40;
    cfg.seed = 12345;

    auto workload = WorkloadGenerator::generateWorkload(cfg);

    // 1. Run Serial Baseline
    std::vector<uew::thermal::ThermalResult> serial_results;
    ParallelExecutor::executeSerial(workload, serial_results);
    TEST_ASSERT(serial_results.size() == 100, "Serial produced 100 results");

    // Verify boundary conditions match problem Dirichlet BCs
    for (size_t i = 0; i < workload.size(); ++i) {
        TEST_ASSERT(std::abs(serial_results[i].temperature_C.front() - workload[i].left_temperature_C) < 1e-12, "Dirichlet left BC preserved");
        TEST_ASSERT(std::abs(serial_results[i].temperature_C.back() - workload[i].right_temperature_C) < 1e-12, "Dirichlet right BC preserved");
    }

    // 2. Run Parallel with 2 and 4 workers
    for (int workers : {2, 4}) {
        std::vector<uew::thermal::ThermalResult> parallel_results;
        ParallelExecutor::executeParallel(workload, workers, parallel_results);
        TEST_ASSERT(parallel_results.size() == 100, "Parallel produced 100 results");

        double max_diff = 0.0;
        for (size_t i = 0; i < workload.size(); ++i) {
            TEST_ASSERT(serial_results[i].temperature_C.size() == parallel_results[i].temperature_C.size(), "Node count matches");
            for (size_t j = 0; j < serial_results[i].temperature_C.size(); ++j) {
                double diff = std::abs(serial_results[i].temperature_C[j] - parallel_results[i].temperature_C[j]);
                if (diff > max_diff) max_diff = diff;
            }
        }

        // Must strictly be <= 1e-8 degC
        TEST_ASSERT(max_diff <= 1.0e-8, "Serial and parallel outputs agree within 1e-8 C");
    }

    std::cout << "PASSED\n";
}

void test_benchmark_harness() {
    std::cout << "[RUNNING] Benchmark Harness - Full Suite Execution & CSV Export... ";

    BenchmarkConfig cfg;
    cfg.case_count = 100;
    cfg.elements = 20;
    cfg.worker_counts = {1, 2, 4};
    cfg.repetitions = 5;
    cfg.seed = 777;

    auto suite = BenchmarkHarness::runSuite(cfg);

    TEST_ASSERT(suite.all_passed, "Suite all_passed flag is true");
    TEST_ASSERT(suite.numerical_agreement_passed, "Numerical agreement passed");
    TEST_ASSERT(suite.max_global_discrepancy_C <= 1.0e-8, "Global discrepancy <= 1e-8 C");
    TEST_ASSERT(suite.worker_results.size() == 3, "Contains results for 1, 2, and 4 workers");

    // Worker 1 is serial baseline
    TEST_ASSERT(suite.worker_results[0].worker_count == 1, "First result is 1 worker");
    TEST_ASSERT(suite.worker_results[0].is_serial_baseline == true, "First is serial baseline");
    TEST_ASSERT(suite.worker_results[0].repetition_ms.size() == 5, "5 repetitions recorded");
    TEST_ASSERT(suite.worker_results[0].median_ms > 0.0, "Positive median time");
    TEST_ASSERT(suite.worker_results[0].speedup == 1.0, "Serial speedup is 1.0");
    TEST_ASSERT(suite.worker_results[0].efficiency == 1.0, "Serial efficiency is 1.0");

    // Worker 2 and 4
    for (size_t i = 1; i < suite.worker_results.size(); ++i) {
        const auto& w = suite.worker_results[i];
        TEST_ASSERT(w.worker_count >= 2, "Parallel worker count >= 2");
        TEST_ASSERT(w.repetition_ms.size() == 5, "5 repetitions recorded");
        TEST_ASSERT(w.median_ms > 0.0, "Positive median time");
        TEST_ASSERT(w.speedup > 0.0, "Positive speedup calculated");
        TEST_ASSERT(w.efficiency > 0.0, "Positive efficiency calculated");
        TEST_ASSERT(w.numerical_agreement_passed, "Parallel result matches serial");
    }

    // CSV Export verification
    std::string csv = BenchmarkHarness::exportBenchmarkCsv(suite);
    TEST_ASSERT(!csv.empty(), "CSV export non-empty");
    TEST_ASSERT(csv.find("# Unified Engineering Workbench - Multicore Benchmark Export") != std::string::npos, "CSV title comment");
    TEST_ASSERT(csv.find("worker_count,is_serial,rep1_ms,rep2_ms,rep3_ms,rep4_ms,rep5_ms,median_ms,speedup,efficiency,max_discrepancy_C,numerical_pass") != std::string::npos, "CSV header columns");
    TEST_ASSERT(csv.find("1,true,") != std::string::npos, "CSV contains serial row");

    std::cout << "PASSED\n";
}

int main() {
    std::cout << "========================================\n";
    std::cout << "UEW Multicore Performance Unit Tests\n";
    std::cout << "========================================\n";

    try {
        test_workload_generator();
        test_environment_helper();
        test_parallel_numerical_agreement();
        test_benchmark_harness();

        std::cout << "\nALL MULTICORE PERFORMANCE TESTS PASSED (100%)\n";
        return 0;
    } catch (const std::exception& ex) {
        std::cerr << "EXCEPTION: " << ex.what() << "\n";
        return 1;
    }
}
