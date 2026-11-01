#include "WorkloadGenerator.h"
#include <random>
#include <stdexcept>

namespace uew::benchmark {

std::vector<uew::thermal::ThermalProblem> WorkloadGenerator::generateWorkload(const BenchmarkConfig& config) {
    if (config.case_count <= 0) {
        throw std::invalid_argument("Workload case_count must be strictly positive");
    }
    if (config.elements <= 0) {
        throw std::invalid_argument("Workload elements must be strictly positive");
    }
    if (config.k_min <= 0.0 || config.k_max < config.k_min) {
        throw std::invalid_argument("Thermal conductivity k range must be strictly positive with k_max >= k_min");
    }
    if (config.q_min <= 0.0 || config.q_max < config.q_min) {
        throw std::invalid_argument("Heat generation q range must be strictly positive with q_max >= q_min");
    }

    std::mt19937 rng(config.seed);
    std::uniform_real_distribution<double> dist_k(config.k_min, config.k_max);
    std::uniform_real_distribution<double> dist_q(config.q_min, config.q_max);
    std::uniform_real_distribution<double> dist_tl(config.t_left_min, config.t_left_max);
    std::uniform_real_distribution<double> dist_tr(config.t_right_min, config.t_right_max);

    std::vector<uew::thermal::ThermalProblem> cases;
    cases.reserve(static_cast<size_t>(config.case_count));

    for (int i = 0; i < config.case_count; ++i) {
        uew::thermal::ThermalProblem p;
        p.length_m = 1.0;
        p.area_m2 = 1.0e-4; // 0.0001 m^2
        p.conductivity_W_mK = dist_k(rng);
        p.generation_W_m3 = dist_q(rng);
        p.left_temperature_C = dist_tl(rng);
        p.right_temperature_C = dist_tr(rng);
        p.elements = config.elements;
        cases.push_back(p);
    }

    return cases;
}

} // namespace uew::benchmark
