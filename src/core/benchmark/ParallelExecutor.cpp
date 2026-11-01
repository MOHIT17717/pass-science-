#include "ParallelExecutor.h"
#include <thread>
#include <algorithm>
#include <exception>
#include <stdexcept>

namespace uew::benchmark {

void ParallelExecutor::executeSerial(
    const std::vector<uew::thermal::ThermalProblem>& workload,
    std::vector<uew::thermal::ThermalResult>& results)
{
    const size_t total_cases = workload.size();
    results.resize(total_cases);

    for (size_t i = 0; i < total_cases; ++i) {
        results[i] = uew::thermal::solveSteady1DRod(workload[i]);
    }
}

void ParallelExecutor::executeParallel(
    const std::vector<uew::thermal::ThermalProblem>& workload,
    int requested_workers,
    std::vector<uew::thermal::ThermalResult>& results)
{
    const size_t total_cases = workload.size();
    results.resize(total_cases);

    if (total_cases == 0) {
        return;
    }

    unsigned int hw_threads = std::thread::hardware_concurrency();
    if (hw_threads == 0) hw_threads = 1;

    // Bound worker count by requested workers and available hardware concurrency
    int worker_count = std::max(2, std::min(requested_workers, static_cast<int>(hw_threads)));

    // If workload count is less than worker count, clamp workers
    if (static_cast<size_t>(worker_count) > total_cases) {
        worker_count = static_cast<int>(total_cases);
    }

    std::vector<std::exception_ptr> worker_exceptions(worker_count, nullptr);
    std::vector<std::thread> workers;
    workers.reserve(worker_count);

    // RAII joiner to guarantee all spawned threads are joined on exit or exception
    struct RAIIJoiner {
        std::vector<std::thread>& ths;
        ~RAIIJoiner() {
            for (auto& t : ths) {
                if (t.joinable()) {
                    t.join();
                }
            }
        }
    } joiner{workers};

    for (int t = 0; t < worker_count; ++t) {
        const size_t start_idx = (static_cast<size_t>(t) * total_cases) / static_cast<size_t>(worker_count);
        const size_t end_idx = (static_cast<size_t>(t + 1) * total_cases) / static_cast<size_t>(worker_count);

        workers.emplace_back([&workload, &results, &worker_exceptions, t, start_idx, end_idx]() {
            try {
                for (size_t i = start_idx; i < end_idx; ++i) {
                    results[i] = uew::thermal::solveSteady1DRod(workload[i]);
                }
            } catch (...) {
                worker_exceptions[t] = std::current_exception();
            }
        });
    }

    // Join all worker threads explicitly
    for (auto& w : workers) {
        if (w.joinable()) {
            w.join();
        }
    }

    // Check if any worker encountered an exception
    for (int t = 0; t < worker_count; ++t) {
        if (worker_exceptions[t]) {
            std::rethrow_exception(worker_exceptions[t]);
        }
    }
}

} // namespace uew::benchmark
