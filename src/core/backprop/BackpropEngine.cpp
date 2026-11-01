#include "BackpropEngine.h"
#include <cmath>
#include <sstream>
#include <iomanip>
#include <algorithm>

namespace uew::backprop {

ForwardState BackpropEngine::forward(double x, double y, const ModelParameters& params) {
    ForwardState state;
    state.x = x;
    state.y = y;
    state.z = params.w * x + params.b;
    state.h = std::tanh(state.z);
    state.y_hat = params.v * state.h + params.c;
    state.error = state.y_hat - y;
    state.loss = 0.5 * state.error * state.error;
    return state;
}

Gradients BackpropEngine::backward(const ForwardState& state, const ModelParameters& params) {
    Gradients grads;
    // dJ/dy_hat = y_hat - y
    const double dJ_dyhat = state.error;

    // dJ/dv = (y_hat - y) * h
    grads.dJ_dv = dJ_dyhat * state.h;

    // dJ/dc = (y_hat - y) * 1
    grads.dJ_dc = dJ_dyhat;

    // dh/dz = 1 - tanh^2(z) = 1 - h^2
    const double dh_dz = 1.0 - state.h * state.h;

    // dJ/dw = (y_hat - y) * v * (1 - h^2) * x
    grads.dJ_dw = dJ_dyhat * params.v * dh_dz * state.x;

    // dJ/db = (y_hat - y) * v * (1 - h^2) * 1
    grads.dJ_db = dJ_dyhat * params.v * dh_dz * 1.0;

    return grads;
}

ModelParameters BackpropEngine::simultaneous_update(const ModelParameters& current, const Gradients& grads, double learning_rate) {
    ModelParameters updated;
    // All parameters updated simultaneously using gradients computed from current state
    updated.w = current.w - learning_rate * grads.dJ_dw;
    updated.b = current.b - learning_rate * grads.dJ_db;
    updated.v = current.v - learning_rate * grads.dJ_dv;
    updated.c = current.c - learning_rate * grads.dJ_dc;
    return updated;
}

GradientCheckReport BackpropEngine::check_gradients(double x, double y, const ModelParameters& params, double epsilon, double tolerance) {
    GradientCheckReport report;
    report.epsilon = epsilon;
    report.tolerance = tolerance;
    report.max_absolute_error = 0.0;
    report.all_passed = true;

    const ForwardState base_forward = forward(x, y, params);
    const Gradients ana_grads = backward(base_forward, params);

    auto check_param = [&](const std::string& name, double ana_grad, auto mutate_plus, auto mutate_minus) {
        ModelParameters p_plus = params;
        ModelParameters p_minus = params;
        mutate_plus(p_plus, epsilon);
        mutate_minus(p_minus, epsilon);

        const double loss_plus = forward(x, y, p_plus).loss;
        const double loss_minus = forward(x, y, p_minus).loss;
        const double num_grad = (loss_plus - loss_minus) / (2.0 * epsilon);
        const double err = std::abs(num_grad - ana_grad);

        SingleGradientCheck check;
        check.parameter_name = name;
        check.analytical_gradient = ana_grad;
        check.numerical_gradient = num_grad;
        check.absolute_error = err;
        check.passed = (err <= tolerance);

        if (!check.passed) {
            report.all_passed = false;
        }
        if (err > report.max_absolute_error) {
            report.max_absolute_error = err;
        }
        report.checks.push_back(check);
    };

    check_param("w", ana_grads.dJ_dw, [](ModelParameters& p, double eps) { p.w += eps; }, [](ModelParameters& p, double eps) { p.w -= eps; });
    check_param("b", ana_grads.dJ_db, [](ModelParameters& p, double eps) { p.b += eps; }, [](ModelParameters& p, double eps) { p.b -= eps; });
    check_param("v", ana_grads.dJ_dv, [](ModelParameters& p, double eps) { p.v += eps; }, [](ModelParameters& p, double eps) { p.v -= eps; });
    check_param("c", ana_grads.dJ_dc, [](ModelParameters& p, double eps) { p.c += eps; }, [](ModelParameters& p, double eps) { p.c -= eps; });

    return report;
}

BackpropSuiteResult BackpropEngine::run_training(double x, double y, ModelParameters initial_params, double learning_rate, int steps) {
    BackpropSuiteResult suite;

    // 1. Initial State (Step 0)
    suite.initial_forward = forward(x, y, initial_params);
    suite.initial_gradients = backward(suite.initial_forward, initial_params);
    suite.gradient_check = check_gradients(x, y, initial_params);

    // 2. Step 1 Simultaneous Parameter Update
    suite.step1_parameters = simultaneous_update(initial_params, suite.initial_gradients, learning_rate);
    suite.step1_forward = forward(x, y, suite.step1_parameters);

    // 3. Multi-Step Training History (Step 0 to Step `steps`) -> (steps + 1) total records
    suite.history.reserve(steps + 1);

    ModelParameters current_params = initial_params;
    suite.monotonic_loss_reduction = true;

    // Record Step 0
    TrainingRecord r0;
    r0.step = 0;
    r0.loss = suite.initial_forward.loss;
    r0.y_hat = suite.initial_forward.y_hat;
    r0.params = initial_params;
    r0.grads = suite.initial_gradients;
    suite.history.push_back(r0);

    double prev_loss = r0.loss;

    // 100 Subsequent Training Updates
    for (int k = 0; k < steps; ++k) {
        // Calculate gradients at current step k
        const ForwardState st = forward(x, y, current_params);
        const Gradients gr = backward(st, current_params);

        // Update parameters simultaneously
        current_params = simultaneous_update(current_params, gr, learning_rate);

        // Compute state at step k + 1
        const ForwardState next_st = forward(x, y, current_params);
        const Gradients next_gr = backward(next_st, current_params);

        TrainingRecord rec;
        rec.step = k + 1;
        rec.loss = next_st.loss;
        rec.y_hat = next_st.y_hat;
        rec.params = current_params;
        rec.grads = next_gr;

        if (rec.loss >= prev_loss) {
            suite.monotonic_loss_reduction = false;
        }
        prev_loss = rec.loss;

        suite.history.push_back(rec);
    }

    suite.final_loss_converged = (suite.history.back().loss < 1e-6);

    std::ostringstream oss;
    oss << "Single-neuron regression (x=" << x << ", y=" << y << ") trained for " << steps
        << " steps with learning rate " << learning_rate << ". Initial loss: "
        << std::fixed << std::setprecision(6) << suite.initial_forward.loss
        << ", Final loss: " << std::scientific << std::setprecision(6) << suite.history.back().loss;
    suite.summary = oss.str();

    return suite;
}

std::string BackpropEngine::export_csv(const BackpropSuiteResult& result) {
    std::ostringstream oss;
    // Metadata comments with #
    oss << "# Model: Single-Neuron Regression (tanh activation)\n";
    oss << "# Equation: h = tanh(w*x + b), y_hat = v*h + c, J = 0.5 * (y_hat - y)^2\n";
    oss << "# Target Sample: x=1.0, y=2.0\n";
    oss << "# Initial Parameters: w0=0.5, b0=0.0, v0=1.0, c0=0.0\n";
    oss << "# Learning Rate: 0.1\n";
    oss << "# Finite-Difference Epsilon: " << result.gradient_check.epsilon << "\n";
    oss << "# Gradient Check Max Error: " << std::scientific << std::setprecision(6) << result.gradient_check.max_absolute_error << "\n";
    oss << "# Gradient Check All Passed: " << (result.gradient_check.all_passed ? "true" : "false") << "\n";
    oss << "# Total Records: " << result.history.size() << "\n";

    // Column header row
    oss << "step,loss,y_hat,w,b,v,c,grad_w,grad_b,grad_v,grad_c\n";

    // Data rows
    oss << std::fixed << std::setprecision(8);
    for (const auto& r : result.history) {
        oss << r.step << ","
            << r.loss << ","
            << r.y_hat << ","
            << r.params.w << ","
            << r.params.b << ","
            << r.params.v << ","
            << r.params.c << ","
            << r.grads.dJ_dw << ","
            << r.grads.dJ_db << ","
            << r.grads.dJ_dv << ","
            << r.grads.dJ_dc << "\n";
    }

    return oss.str();
}

} // namespace uew::backprop
