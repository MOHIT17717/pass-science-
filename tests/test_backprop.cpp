#include "core/backprop/BackpropEngine.h"
#include <iostream>
#include <cmath>
#include <sstream>
#include <vector>

using namespace uew::backprop;

static int g_failed = 0;
static int g_passed = 0;

#define TEST_ASSERT(cond, msg) \
    do { \
        if (!(cond)) { \
            std::cerr << "FAILED: " << msg << " (" << __FILE__ << ":" << __LINE__ << ")\n"; \
            g_failed++; \
        } else { \
            g_passed++; \
        } \
    } while (0)

#define TEST_NEAR(actual, expected, tol, msg) \
    do { \
        double diff = std::abs((actual) - (expected)); \
        if (diff > (tol)) { \
            std::cerr << "FAILED: " << msg << " | Actual: " << (actual) << ", Expected: " << (expected) \
                      << ", Diff: " << diff << " > " << (tol) << " (" << __FILE__ << ":" << __LINE__ << ")\n"; \
            g_failed++; \
        } else { \
            g_passed++; \
        } \
    } while (0)

void test_step0_analytical_values() {
    ModelParameters p0{0.5, 0.0, 1.0, 0.0};
    ForwardState f0 = BackpropEngine::forward(1.0, 2.0, p0);

    TEST_NEAR(f0.z, 0.5, 1e-12, "z0 must be 0.5");
    TEST_NEAR(f0.h, 0.462117157260, 1e-6, "h0 must equal tanh(0.5)");
    TEST_NEAR(f0.y_hat, 0.462117157260, 1e-6, "y_hat0 must equal h0");
    TEST_NEAR(f0.error, -1.53788284274, 1e-6, "error0 must be y_hat - 2.0");
    TEST_NEAR(f0.loss, 1.182541819, 1e-6, "loss0 must be ~1.1825418");

    Gradients g0 = BackpropEngine::backward(f0, p0);
    TEST_NEAR(g0.dJ_dw, -1.209464475, 1e-6, "dJ/dw must be -1.209464");
    TEST_NEAR(g0.dJ_db, -1.209464475, 1e-6, "dJ/db must be -1.209464");
    TEST_NEAR(g0.dJ_dv, -0.710682047, 1e-6, "dJ/dv must be -0.710682");
    TEST_NEAR(g0.dJ_dc, -1.537882843, 1e-6, "dJ/dc must be -1.537883");
}

void test_simultaneous_parameter_update() {
    ModelParameters p0{0.5, 0.0, 1.0, 0.0};
    ForwardState f0 = BackpropEngine::forward(1.0, 2.0, p0);
    Gradients g0 = BackpropEngine::backward(f0, p0);

    ModelParameters p1 = BackpropEngine::simultaneous_update(p0, g0, 0.1);

    TEST_NEAR(p1.w, 0.620946448, 1e-6, "w1 must be ~0.620946");
    TEST_NEAR(p1.b, 0.120946448, 1e-6, "b1 must be ~0.120946");
    TEST_NEAR(p1.v, 1.071068205, 1e-6, "v1 must be ~1.071068");
    TEST_NEAR(p1.c, 0.153788284, 1e-6, "c1 must be ~0.153788");

    ForwardState f1 = BackpropEngine::forward(1.0, 2.0, p1);
    TEST_NEAR(f1.y_hat, 0.828869123, 1e-6, "y_hat1 must be ~0.828869");
    TEST_NEAR(f1.loss, 0.685773765, 1e-6, "loss1 must be ~0.685774");
    TEST_ASSERT(f1.loss < f0.loss, "Step 1 loss must be strictly lower than Step 0 loss");
}

void test_finite_difference_gradient_check() {
    ModelParameters p0{0.5, 0.0, 1.0, 0.0};
    GradientCheckReport report = BackpropEngine::check_gradients(1.0, 2.0, p0, 1e-6, 1e-5);

    TEST_ASSERT(report.all_passed, "All gradients must pass numerical check with tol <= 1e-5");
    TEST_ASSERT(report.max_absolute_error <= 1e-5, "Max absolute error must be <= 1e-5");
    TEST_ASSERT(report.checks.size() == 4, "Must check all 4 parameters (w, b, v, c)");

    for (const auto& chk : report.checks) {
        TEST_ASSERT(chk.passed, "Check for " + chk.parameter_name + " must pass");
        TEST_ASSERT(chk.absolute_error <= 1e-5, chk.parameter_name + " error <= 1e-5");
    }
}

void test_100_step_training_and_convergence() {
    BackpropSuiteResult suite = BackpropEngine::run_training(1.0, 2.0, {0.5, 0.0, 1.0, 0.0}, 0.1, 100);

    TEST_ASSERT(suite.history.size() == 101, "History must contain initial state + 100 updates = 101 records");
    TEST_ASSERT(suite.history[0].step == 0, "Record 0 must be step 0");
    TEST_ASSERT(suite.history[100].step == 100, "Record 100 must be step 100");

    TEST_ASSERT(suite.monotonic_loss_reduction, "Loss must decrease strictly monotonically across all 100 steps");
    TEST_ASSERT(suite.history.back().loss < 1e-6, "Final loss must be < 1e-6 (converged)");
    TEST_NEAR(suite.history.back().y_hat, 2.0, 0.005, "Final y_hat must be very close to target 2.0");
}

void test_csv_export_format() {
    BackpropSuiteResult suite = BackpropEngine::run_training(1.0, 2.0, {0.5, 0.0, 1.0, 0.0}, 0.1, 100);
    std::string csv = BackpropEngine::export_csv(suite);

    std::istringstream iss(csv);
    std::string line;
    int comment_count = 0;
    int header_count = 0;
    int data_count = 0;

    while (std::getline(iss, line)) {
        if (line.empty()) continue;
        if (line[0] == '#') {
            comment_count++;
        } else if (line.find("step,loss,y_hat") != std::string::npos) {
            header_count++;
        } else {
            data_count++;
        }
    }

    TEST_ASSERT(comment_count >= 5, "CSV must have metadata comment lines");
    TEST_ASSERT(header_count == 1, "CSV must have exactly 1 column header row");
    TEST_ASSERT(data_count == 101, "CSV must contain exactly 101 data records (step 0 through 100)");
}

int main() {
    std::cout << "========================================\n";
    std::cout << "Running Backprop C++ Unit Tests (Task 11)\n";
    std::cout << "========================================\n";

    test_step0_analytical_values();
    test_simultaneous_parameter_update();
    test_finite_difference_gradient_check();
    test_100_step_training_and_convergence();
    test_csv_export_format();

    std::cout << "========================================\n";
    std::cout << "Tests Passed: " << g_passed << "\n";
    std::cout << "Tests Failed: " << g_failed << "\n";
    std::cout << "========================================\n";

    return (g_failed == 0) ? 0 : 1;
}
