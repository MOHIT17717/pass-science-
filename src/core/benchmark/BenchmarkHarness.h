#pragma once

#include <string>
#include "BenchmarkModels.h"

namespace uew::benchmark {

class BenchmarkHarness {
public:
    // Execute warm-up, serial baseline, and parallel worker configurations
    static BenchmarkSuiteResult runSuite(const BenchmarkConfig& config);

    // Format benchmark results as RFC 4180 CSV with descriptive header metadata
    static std::string exportBenchmarkCsv(const BenchmarkSuiteResult& suite);
};

} // namespace uew::benchmark
