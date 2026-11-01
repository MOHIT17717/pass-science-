#pragma once

#include "BackpropModels.h"
#include <string>

namespace uew::backprop {

/**
 * High-precision manual C++17 neural network backpropagation engine.
 * No external machine learning frameworks, libraries, or automatic differentiation.
 */
class BackpropEngine {
public:
    static ForwardState forward(double x, double y, const ModelParameters& params);
    static Gradients backward(const ForwardState& state, const ModelParameters& params);
    static ModelParameters simultaneous_update(const ModelParameters& current, const Gradients& grads, double learning_rate);
    static GradientCheckReport check_gradients(double x, double y, const ModelParameters& params, double epsilon = 1e-6, double tolerance = 1e-5);
    static BackpropSuiteResult run_training(double x = 1.0, double y = 2.0, ModelParameters initial_params = {0.5, 0.0, 1.0, 0.0}, double learning_rate = 0.1, int steps = 100);
    static std::string export_csv(const BackpropSuiteResult& result);
};

} // namespace uew::backprop
