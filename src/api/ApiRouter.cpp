#include "ApiRouter.h"
#include "core/thermal/ThermalVerification.h"
#include <chrono>
#include <sstream>

#ifdef _WIN32
#include <windows.h>
#else
#include <unistd.h>
#endif

namespace uew::api {

void ApiRouter::register_routes(HttpServer& server) {
    server.set_route("GET", "/api/v1/health", &ApiRouter::handle_health);
    server.set_route("POST", "/api/v1/thermal/solve", &ApiRouter::handle_thermal_solve);
    server.set_route("GET", "/api/v1/thermal/solve", &ApiRouter::handle_thermal_solve);
    server.set_route("POST", "/api/v1/thermal/export", &ApiRouter::handle_thermal_export);
    server.set_route("GET", "/api/v1/thermal/export", &ApiRouter::handle_thermal_export);
}

HttpResponse ApiRouter::handle_health(const HttpRequest& /*req*/) {
    Json root;
    root["status"] = "ok";
    root["version"] = "0.1.0";
    root["core_ready"] = true;

    auto now = std::chrono::system_clock::now();
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();
    root["timestamp_ms"] = static_cast<int64_t>(ms);

#ifdef _WIN32
    root["pid"] = static_cast<int64_t>(GetCurrentProcessId());
#else
    root["pid"] = static_cast<int64_t>(getpid());
#endif

    // Explicit units specification per assignment requirement & architecture invariant
    Json units;
    units["temperature"] = "degC";
    units["position"] = "m";
    units["thermal_conductivity"] = "W/(m*K)";
    units["heat_generation"] = "W/m^3";
    units["time"] = "s";
    root["units"] = units;

    return HttpResponse::ok_json(root);
}

static Json mesh_result_to_json(const uew::thermal::MeshVerificationResult& m) {
    Json j;
    j["elements"] = m.elements;
    j["node_count"] = m.node_count;
    j["element_length_m"] = m.element_length_m;
    j["max_nodal_error_C"] = m.max_nodal_error_C;
    j["max_midpoint_error_C"] = m.max_midpoint_error_C;
    j["theoretical_midpoint_error_C"] = m.theoretical_midpoint_error_C;
    j["convergence_rate"] = m.convergence_rate;

    std::vector<Json> x_arr;
    std::vector<Json> t_fem_arr;
    std::vector<Json> t_exact_arr;
    std::vector<Json> err_arr;

    for (int i = 0; i < m.node_count; ++i) {
        x_arr.emplace_back(m.x_m[i]);
        t_fem_arr.emplace_back(m.fem_temperature_C[i]);
        t_exact_arr.emplace_back(m.analytical_temperature_C[i]);
        err_arr.emplace_back(m.nodal_error_C[i]);
    }

    j["x_m"] = x_arr;
    j["fem_temperature_C"] = t_fem_arr;
    j["analytical_temperature_C"] = t_exact_arr;
    j["nodal_error_C"] = err_arr;

    // Include detailed element midpoint verification records
    std::vector<Json> mid_arr;
    for (const auto& mid : m.midpoints) {
        Json item;
        item["element_id"] = mid.element_id;
        item["x_mid_m"] = mid.x_mid_m;
        item["interpolated_fem_temperature_C"] = mid.interpolated_fem_temp_C;
        item["analytical_temperature_C"] = mid.analytical_temp_C;
        item["error_C"] = mid.error_C;
        mid_arr.push_back(item);
    }
    j["midpoints"] = mid_arr;

    return j;
}

HttpResponse ApiRouter::handle_thermal_solve(const HttpRequest& req) {
    int requested_elements = -1;

    // 1. Check query parameter 'elements'
    std::string q_elem = req.get_query_param("elements");
    if (!q_elem.empty()) {
        try {
            requested_elements = std::stoi(q_elem);
        } catch (...) {
            return HttpResponse::error_json(400, "Bad Request",
                "Query parameter 'elements' must be an integer (allowed: 10, 20, 40, 80).");
        }
    }

    // 2. Check JSON request body if present
    if (!req.body.empty()) {
        try {
            Json body_json = Json::parse(req.body);
            if (body_json.contains("elements")) {
                if (body_json["elements"].is_number()) {
                    requested_elements = static_cast<int>(body_json["elements"].as_int());
                } else {
                    return HttpResponse::error_json(400, "Bad Request",
                        "Parameter 'elements' must be an integer (allowed: 10, 20, 40, 80).");
                }
            }
        } catch (const std::exception& e) {
            return HttpResponse::error_json(400, "Bad Request",
                std::string("Malformed JSON body: ") + e.what());
        }
    }

    if (requested_elements != -1 && !uew::thermal::ThermalVerification::is_valid_mesh_count(requested_elements)) {
        return HttpResponse::error_json(400, "Bad Request",
            "Invalid mesh element count. Allowed mesh counts are 10, 20, 40, and 80.");
    }

    uew::thermal::ThermalProblem p;
    Json root;
    root["status"] = "ok";

    Json problem_meta;
    problem_meta["length_m"] = p.length_m;
    problem_meta["area_m2"] = p.area_m2;
    problem_meta["conductivity_W_mK"] = p.conductivity_W_mK;
    problem_meta["generation_W_m3"] = p.generation_W_m3;
    problem_meta["left_temperature_C"] = p.left_temperature_C;
    problem_meta["right_temperature_C"] = p.right_temperature_C;
    root["problem"] = problem_meta;

    Json units;
    units["temperature"] = "degC";
    units["position"] = "m";
    units["thermal_conductivity"] = "W/(m*K)";
    units["heat_generation"] = "W/m^3";
    units["cross_sectional_area"] = "m^2";
    units["length"] = "m";
    root["units"] = units;

    std::vector<Json> assumptions = {
        Json("Steady-state 1D heat conduction: -d/dx(k*A*dT/dx) = q*A"),
        Json("Uniform volumetric heat generation q = 10000 W/m^3"),
        Json("Constant isotropic thermal conductivity k = 10 W/(m*K)"),
        Json("Insulated lateral rod boundaries (zero radial heat loss)"),
        Json("Prescribed Dirichlet temperature boundaries: T(0) = 100 degC, T(L) = 20 degC"),
        Json("Two-node linear Lagrange finite elements with consistent source loading")
    };
    root["assumptions"] = assumptions;

    if (requested_elements != -1) {
        p.elements = requested_elements;
        auto m_res = uew::thermal::ThermalVerification::solve_and_verify(p);
        root["mesh"] = mesh_result_to_json(m_res);
    } else {
        auto study = uew::thermal::ThermalVerification::run_standard_study(p);
        std::vector<Json> meshes_arr;
        for (const auto& m : study.meshes) {
            meshes_arr.push_back(mesh_result_to_json(m));
        }
        root["meshes"] = meshes_arr;
        root["summary"] = study.summary;
        root["verified"] = study.verified;
    }

    return HttpResponse::ok_json(root);
}

HttpResponse ApiRouter::handle_thermal_export(const HttpRequest& req) {
    int requested_elements = 80; // Default to 80-element high-resolution mesh
    std::string export_type = "combined"; // Default to combined nodal + midpoint export

    // 1. Check query parameters
    std::string q_elem = req.get_query_param("elements");
    if (!q_elem.empty()) {
        try {
            requested_elements = std::stoi(q_elem);
        } catch (...) {
            return HttpResponse::error_json(400, "Bad Request",
                "Query parameter 'elements' must be an integer (allowed: 10, 20, 40, 80).");
        }
    }

    std::string q_type = req.get_query_param("type");
    if (!q_type.empty()) {
        export_type = q_type;
    }

    // 2. Check JSON request body if present
    if (!req.body.empty()) {
        try {
            Json body_json = Json::parse(req.body);
            if (body_json.contains("elements")) {
                if (body_json["elements"].is_number()) {
                    requested_elements = static_cast<int>(body_json["elements"].as_int());
                } else {
                    return HttpResponse::error_json(400, "Bad Request",
                        "Parameter 'elements' must be an integer (allowed: 10, 20, 40, 80).");
                }
            }
            if (body_json.contains("type")) {
                if (body_json["type"].is_string()) {
                    export_type = body_json["type"].as_string();
                } else {
                    return HttpResponse::error_json(400, "Bad Request",
                        "Parameter 'type' must be a string ('nodal', 'midpoint', or 'combined').");
                }
            }
        } catch (const std::exception& e) {
            return HttpResponse::error_json(400, "Bad Request",
                std::string("Malformed JSON body: ") + e.what());
        }
    }

    if (!uew::thermal::ThermalVerification::is_valid_mesh_count(requested_elements)) {
        return HttpResponse::error_json(400, "Bad Request",
            "Invalid mesh element count. Allowed mesh counts are 10, 20, 40, and 80.");
    }

    if (export_type != "nodal" && export_type != "midpoint" &&
        export_type != "combined" && export_type != "detailed" && export_type != "all") {
        return HttpResponse::error_json(400, "Bad Request",
            "Invalid export type. Allowed export types are 'nodal', 'midpoint', or 'combined'.");
    }

    uew::thermal::ThermalProblem p;
    p.elements = requested_elements;
    auto m_res = uew::thermal::ThermalVerification::solve_and_verify(p);
    std::string csv_data = uew::thermal::ThermalVerification::export_csv(m_res, export_type);

    HttpResponse resp;
    resp.status_code = 200;
    resp.status_text = "OK";
    resp.headers["Content-Type"] = "text/csv; charset=utf-8";
    resp.headers["Content-Disposition"] =
        "attachment; filename=\"thermal_mesh_" + std::to_string(requested_elements) + "_" + export_type + ".csv\"";
    resp.body = csv_data;
    return resp;
}

} // namespace uew::api
