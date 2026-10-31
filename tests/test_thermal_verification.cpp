#include "core/thermal/ThermalVerification.h"
#include "core/thermal/FEMSolver.h"
#include <iostream>
#include <sstream>
#include <cmath>
#include <stdexcept>

#define TEST_ASSERT(cond, msg) \
    do { \
        if (!(cond)) { \
            std::cerr << "\n[TEST FAILURE] " << (msg) << " (" << __FILE__ << ":" << __LINE__ << ")\n"; \
            throw std::runtime_error(std::string("Assertion failed: ") + (msg)); \
        } \
    } while (0)

using namespace uew::thermal;

void test_analytical_solution() {
    ThermalProblem p;
    // T_exact(x) = 100 - 80*x + 500*x*(1-x) = 100 + 420*x - 500*x^2
    double t0 = analyticalTemperature(p, 0.0);
    double t1 = analyticalTemperature(p, 1.0);
    double t_peak = analyticalTemperature(p, 0.42); // dT/dx = 420 - 1000*x = 0 => x = 0.42

    TEST_ASSERT(std::abs(t0 - 100.0) < 1e-12, "Analytical T(0) == 100.0 C");
    TEST_ASSERT(std::abs(t1 - 20.0) < 1e-12, "Analytical T(1) == 20.0 C");
    TEST_ASSERT(std::abs(t_peak - 188.2) < 1e-12, "Analytical peak temperature T(0.42) == 188.2 C");
    std::cout << "PASS: Analytical temperature function verified at boundaries and peak." << std::endl;
}

void test_four_mesh_verification_and_convergence() {
    const double expected_errors[4] = {
        1.25000000,   // N = 10
        0.31250000,   // N = 20
        0.07812500,   // N = 40
        0.01953125    // N = 80
    };
    const int expected_nodes[4] = { 11, 21, 41, 81 };
    const int meshes[4] = { 10, 20, 40, 80 };

    auto study = ThermalVerification::run_standard_study();
    TEST_ASSERT(study.verified, "Study flagged as verified");
    TEST_ASSERT(study.meshes.size() == 4, "Study contains exactly 4 mesh results");

    for (size_t i = 0; i < 4; ++i) {
        const auto& m = study.meshes[i];
        TEST_ASSERT(m.elements == meshes[i], "Correct element count");
        TEST_ASSERT(m.node_count == expected_nodes[i], "Correct node count (N+1)");
        TEST_ASSERT(m.x_m.size() == static_cast<size_t>(expected_nodes[i]), "x_m size matches node count");
        TEST_ASSERT(m.fem_temperature_C.size() == static_cast<size_t>(expected_nodes[i]), "fem_temp size matches node count");
        TEST_ASSERT(m.midpoints.size() == static_cast<size_t>(meshes[i]), "midpoints size matches element count");

        // 1. Boundary condition enforcement
        TEST_ASSERT(std::abs(m.fem_temperature_C.front() - 100.0) < 1e-10, "Left boundary condition T(0) == 100 C");
        TEST_ASSERT(std::abs(m.fem_temperature_C.back() - 20.0) < 1e-10, "Right boundary condition T(L) == 20 C");

        // 2. Nodal error check: In 1D linear FEM with constant source, nodal error is machine precision zero
        TEST_ASSERT(m.max_nodal_error_C < 1e-11, "Nodal error is near machine zero (< 1e-11 C)");

        // 3. Midpoint error check: Matches theoretical q/(8k) * le^2 exactly
        double diff = std::abs(m.max_midpoint_error_C - expected_errors[i]);
        TEST_ASSERT(diff < 1e-8, "Midpoint error matches exact theoretical value");
        TEST_ASSERT(std::abs(m.theoretical_midpoint_error_C - expected_errors[i]) < 1e-8, "Theoretical midpoint error matches");

        // Verify individual element midpoint records
        for (const auto& mid : m.midpoints) {
            TEST_ASSERT(std::abs(mid.error_C - expected_errors[i]) < 1e-7,
                "Every element midpoint error matches theoretical value");
        }

        std::cout << "INFO: Mesh N=" << m.elements
                  << " Nodes=" << m.node_count
                  << " MaxNodalErr=" << m.max_nodal_error_C << " C"
                  << " MaxMidErr=" << m.max_midpoint_error_C << " C"
                  << " Rate=" << m.convergence_rate << std::endl;
    }

    // 4. Convergence rate: for mesh halving, error reduces by factor of 4 => log2(4) = 2.0 (second order)
    for (size_t i = 1; i < 4; ++i) {
        double rate = study.meshes[i].convergence_rate;
        TEST_ASSERT(std::abs(rate - 2.0) < 1e-4, "Second-order O(h^2) convergence rate verified (log2 ratio == 2.0)");
    }

    // 5. 80-element midpoint error explicitly verified to be approximately 0.01953125 C
    TEST_ASSERT(std::abs(study.meshes[3].max_midpoint_error_C - 0.01953125) < 1e-8,
        "80-element midpoint error is 0.01953125 C");
    std::cout << "PASS: All four meshes (N=10, 20, 40, 80) and O(h^2) convergence verified." << std::endl;
}

void test_csv_export() {
    ThermalProblem p;
    p.elements = 80;
    auto res = ThermalVerification::solve_and_verify(p);

    // 1. Test Nodal CSV export
    std::string csv_nodal = ThermalVerification::export_nodal_csv(res);
    TEST_ASSERT(!csv_nodal.empty(), "Nodal CSV not empty");
    TEST_ASSERT(csv_nodal.find("node_id,position_m,fem_temperature_C,analytical_temperature_C,error_C") != std::string::npos,
        "Nodal CSV contains exact columns");
    {
        std::istringstream stream(csv_nodal);
        std::string line;
        int rows = 0;
        while (std::getline(stream, line)) {
            if (!line.empty() && line.back() == '\r') line.pop_back();
            if (line.empty() || line[0] == '#' || line.rfind("node_id", 0) == 0) continue;
            ++rows;
        }
        TEST_ASSERT(rows == 81, "Nodal CSV contains exactly 81 rows for N=80");
    }

    // 2. Test Midpoint CSV export
    std::string csv_mid = ThermalVerification::export_midpoint_csv(res);
    TEST_ASSERT(!csv_mid.empty(), "Midpoint CSV not empty");
    TEST_ASSERT(csv_mid.find("element_id,midpoint_position_m,interpolated_fem_temperature_C,analytical_temperature_C,midpoint_error_C") != std::string::npos,
        "Midpoint CSV contains exact columns");
    TEST_ASSERT(csv_mid.find("# Maximum Midpoint Error: 0.01953125 degC") != std::string::npos,
        "Midpoint CSV header contains exact maximum midpoint error metadata");
    {
        std::istringstream stream(csv_mid);
        std::string line;
        int rows = 0;
        while (std::getline(stream, line)) {
            if (!line.empty() && line.back() == '\r') line.pop_back();
            if (line.empty() || line[0] == '#' || line.rfind("element_id", 0) == 0) continue;
            ++rows;
            // Verify error value in line ends with 0.01953125
            TEST_ASSERT(line.find("0.01953125") != std::string::npos, "Midpoint record error is 0.01953125 C");
        }
        TEST_ASSERT(rows == 80, "Midpoint CSV contains exactly 80 rows for N=80");
    }

    // 3. Test Combined CSV export (record_type column)
    std::string csv_comb = ThermalVerification::export_combined_csv(res);
    TEST_ASSERT(!csv_comb.empty(), "Combined CSV not empty");
    TEST_ASSERT(csv_comb.find("record_type,index,position_m,fem_temperature_C,analytical_temperature_C,error_C") != std::string::npos,
        "Combined CSV contains record_type column");
    {
        std::istringstream stream(csv_comb);
        std::string line;
        int node_count = 0, mid_count = 0;
        while (std::getline(stream, line)) {
            if (!line.empty() && line.back() == '\r') line.pop_back();
            if (line.empty() || line[0] == '#') continue;
            if (line.rfind("node,", 0) == 0) ++node_count;
            if (line.rfind("midpoint,", 0) == 0) ++mid_count;
        }
        TEST_ASSERT(node_count == 81, "Combined CSV has 81 node records");
        TEST_ASSERT(mid_count == 80, "Combined CSV has 80 midpoint records");
    }

    // 4. Test export_csv dispatcher
    std::string disp_nodal = ThermalVerification::export_csv(res, "nodal");
    std::string disp_mid = ThermalVerification::export_csv(res, "midpoint");
    std::string disp_comb = ThermalVerification::export_csv(res, "combined");
    TEST_ASSERT(disp_nodal.find("node_id,") != std::string::npos, "Dispatcher nodal");
    TEST_ASSERT(disp_mid.find("element_id,") != std::string::npos, "Dispatcher midpoint");
    TEST_ASSERT(disp_comb.find("record_type,") != std::string::npos, "Dispatcher combined");

    bool rejected_bad_type = false;
    try {
        (void)ThermalVerification::export_csv(res, "unknown_type");
    } catch (const std::invalid_argument&) {
        rejected_bad_type = true;
    }
    TEST_ASSERT(rejected_bad_type, "Invalid export type rejected with std::invalid_argument");

    std::cout << "PASS: All CSV export formats (nodal: 81 rows, midpoint: 80 rows, combined: 161 rows) verified." << std::endl;
}

void test_input_validation() {
    TEST_ASSERT(ThermalVerification::is_valid_mesh_count(10) == true, "10 is valid mesh");
    TEST_ASSERT(ThermalVerification::is_valid_mesh_count(20) == true, "20 is valid mesh");
    TEST_ASSERT(ThermalVerification::is_valid_mesh_count(40) == true, "40 is valid mesh");
    TEST_ASSERT(ThermalVerification::is_valid_mesh_count(80) == true, "80 is valid mesh");
    TEST_ASSERT(ThermalVerification::is_valid_mesh_count(15) == false, "15 is rejected");
    TEST_ASSERT(ThermalVerification::is_valid_mesh_count(0) == false, "0 is rejected");
    TEST_ASSERT(ThermalVerification::is_valid_mesh_count(-10) == false, "-10 is rejected");

    bool rejected_bad_mesh = false;
    try {
        ThermalProblem p;
        p.elements = 15;
        (void)ThermalVerification::solve_and_verify(p);
    } catch (const std::invalid_argument&) {
        rejected_bad_mesh = true;
    }
    TEST_ASSERT(rejected_bad_mesh, "Mesh=15 was rejected by solve_and_verify with std::invalid_argument");

    bool rejected_bad_k = false;
    try {
        ThermalProblem p;
        p.elements = 10;
        p.conductivity_W_mK = -5.0;
        (void)ThermalVerification::solve_and_verify(p);
    } catch (const std::invalid_argument&) {
        rejected_bad_k = true;
    }
    TEST_ASSERT(rejected_bad_k, "Negative conductivity rejected with std::invalid_argument");
    std::cout << "PASS: Input parameter validation and actionable rejections verified." << std::endl;
}

int main() {
    try {
        test_analytical_solution();
        test_four_mesh_verification_and_convergence();
        test_csv_export();
        test_input_validation();
        std::cout << "\nALL TASK 06 THERMAL FEM VERIFICATION TESTS PASSED (100%)\n";
        return 0;
    } catch (const std::exception& ex) {
        std::cerr << "FAIL: " << ex.what() << std::endl;
        return 1;
    }
}
