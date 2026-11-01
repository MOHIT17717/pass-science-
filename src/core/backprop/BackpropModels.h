#pragma once

#include <vector>
#include <string>

namespace uew::backprop {

struct ModelParameters {
    double w = 0.5;
    double b = 0.0;
    double v = 1.0;
    double c = 0.0;
};

struct Gradients {
    double dJ_dw = 0.0;
    double dJ_db = 0.0;
    double dJ_dv = 0.0;
    double dJ_dc = 0.0;
};

struct ForwardState {
    double x = 1.0;
    double y = 2.0;
    double z = 0.0;       // w*x + b
    double h = 0.0;       // tanh(z)
    double y_hat = 0.0;   // v*h + c
    double error = 0.0;   // y_hat - y
    double loss = 0.0;    // 0.5 * (y_hat - y)^2
};

struct SingleGradientCheck {
    std::string parameter_name;
    double analytical_gradient = 0.0;
    double numerical_gradient = 0.0;
    double absolute_error = 0.0;
    bool passed = false;
};

struct GradientCheckReport {
    double epsilon = 1e-6;
    double tolerance = 1e-5;
    double max_absolute_error = 0.0;
    bool all_passed = false;
    std::vector<SingleGradientCheck> checks;
};

struct TrainingRecord {
    int step = 0;
    double loss = 0.0;
    double y_hat = 0.0;
    ModelParameters params;
    Gradients grads;
};

struct BackpropSuiteResult {
    ForwardState initial_forward;
    Gradients initial_gradients;
    ModelParameters step1_parameters;
    ForwardState step1_forward;
    GradientCheckReport gradient_check;
    std::vector<TrainingRecord> history; // 101 records (step 0..100)
    bool monotonic_loss_reduction = true;
    bool final_loss_converged = true; // loss < 1e-6
    std::string summary;
};

} // namespace uew::backprop
