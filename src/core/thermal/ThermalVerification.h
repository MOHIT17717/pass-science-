#pragma once

#include "ThermalModels.h"
#include <vector>
#include <string>

namespace uew::thermal {

struct ElementMidpointResult {
    int element_id{0};
    double x_mid_m{0.0};
    double interpolated_fem_temp_C{0.0};
    double analytical_temp_C{0.0};
    double error_C{0.0};
};

struct MeshVerificationResult {
    int elements{0};
    int node_count{0};
    double element_length_m{0.0};
    std::vector<double> x_m;
    std::vector<double> fem_temperature_C;
    std::vector<double> analytical_temperature_C;
    std::vector<double> nodal_error_C;
    std::vector<ElementMidpointResult> midpoints;
    double max_nodal_error_C{0.0};
    double max_midpoint_error_C{0.0};
    double theoretical_midpoint_error_C{0.0};
    double convergence_rate{0.0}; // log2(error_prev / error_current)
};

struct MultiMeshStudyResult {
    std::vector<MeshVerificationResult> meshes;
    bool verified{false};
    std::string summary;
};

class ThermalVerification {
public:
    static const std::vector<int> ALLOWED_MESHES;

    static bool is_valid_mesh_count(int elements);
    static MeshVerificationResult solve_and_verify(const ThermalProblem& problem);
    static MultiMeshStudyResult run_standard_study(const ThermalProblem& base_problem = ThermalProblem());
    
    // Dedicated CSV export formats
    static std::string export_nodal_csv(const MeshVerificationResult& result);
    static std::string export_midpoint_csv(const MeshVerificationResult& result);
    static std::string export_combined_csv(const MeshVerificationResult& result);
    static std::string export_csv(const MeshVerificationResult& result, const std::string& type = "combined");
    static std::string export_all_meshes_csv(const MultiMeshStudyResult& study);
};

} // namespace uew::thermal
