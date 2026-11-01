#include "ApiRouter.h"
#include "core/thermal/ThermalVerification.h"
#include "core/parsers/StlParser.h"
#include "core/parsers/CsvParser.h"
#include "core/benchmark/BenchmarkHarness.h"
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
    server.set_route("POST", "/api/v1/geometry/parse-stl", &ApiRouter::handle_parse_stl);
    server.set_route("POST", "/api/v1/data/parse-csv", &ApiRouter::handle_parse_csv);
    server.set_route("POST", "/api/v1/benchmark/run", &ApiRouter::handle_benchmark_run);
    server.set_route("GET", "/api/v1/benchmark/run", &ApiRouter::handle_benchmark_run);
    server.set_route("POST", "/api/v1/benchmark/export", &ApiRouter::handle_benchmark_export);
    server.set_route("GET", "/api/v1/benchmark/export", &ApiRouter::handle_benchmark_export);
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

    // High-resolution continuous analytical sampling (201 points) evaluated exclusively in C++
    constexpr int NUM_ANALYTICAL_SAMPLES = 201;
    std::vector<Json> curve_x;
    std::vector<Json> curve_t;
    curve_x.reserve(NUM_ANALYTICAL_SAMPLES);
    curve_t.reserve(NUM_ANALYTICAL_SAMPLES);
    for (int k = 0; k < NUM_ANALYTICAL_SAMPLES; ++k) {
        double x = static_cast<double>(k) / (NUM_ANALYTICAL_SAMPLES - 1) * p.length_m;
        curve_x.emplace_back(x);
        curve_t.emplace_back(uew::thermal::analyticalTemperature(p, x));
    }
    Json analytical_curve;
    analytical_curve["sample_count"] = NUM_ANALYTICAL_SAMPLES;
    analytical_curve["x_m"] = curve_x;
    analytical_curve["temperature_C"] = curve_t;
    root["analytical_curve"] = analytical_curve;

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

static std::string extract_content(const HttpRequest& req) {
    if (req.body.empty()) {
        return "";
    }
    // Check if body is a JSON object with a "content" string field
    const std::string& b = req.body;
    size_t first = b.find_first_not_of(" \t\r\n");
    if (first != std::string::npos && b[first] == '{') {
        try {
            Json j = Json::parse(b);
            if (j.is_object() && j.contains("content") && j["content"].is_string()) {
                return j["content"].as_string();
            }
        } catch (...) {
            // Not valid JSON, treat as raw content
        }
    }
    return req.body;
}

HttpResponse ApiRouter::handle_parse_stl(const HttpRequest& req) {
    std::string content = extract_content(req);
    if (content.empty()) {
        return HttpResponse::error_json(400, "Bad Request", "STL content payload is empty.");
    }

    uew::parsers::StlModel model;
    try {
        model = uew::parsers::StlParser::parse_ascii(content);
    } catch (const std::invalid_argument& e) {
        return HttpResponse::error_json(400, "STL Parsing Error", e.what());
    } catch (const std::exception& e) {
        return HttpResponse::error_json(500, "Internal Server Error", e.what());
    }

    Json root;
    root["status"] = "ok";
    root["solid_name"] = model.solid_name;
    root["triangle_count"] = static_cast<int64_t>(model.triangle_count);

    Json bbox;
    std::vector<Json> bbox_min{ model.bbox.min.x, model.bbox.min.y, model.bbox.min.z };
    std::vector<Json> bbox_max{ model.bbox.max.x, model.bbox.max.y, model.bbox.max.z };
    std::vector<Json> bbox_dim{
        model.bbox.max.x - model.bbox.min.x,
        model.bbox.max.y - model.bbox.min.y,
        model.bbox.max.z - model.bbox.min.z
    };
    bbox["min"] = bbox_min;
    bbox["max"] = bbox_max;
    bbox["dimensions"] = bbox_dim;
    root["bbox"] = bbox;

    size_t recomputed_count = 0;
    std::vector<Json> positions;
    positions.reserve(model.triangles.size() * 9);
    std::vector<Json> normals;
    normals.reserve(model.triangles.size() * 9);

    for (const auto& tri : model.triangles) {
        if (tri.normal_recomputed) ++recomputed_count;

        positions.emplace_back(tri.v1.x);
        positions.emplace_back(tri.v1.y);
        positions.emplace_back(tri.v1.z);

        positions.emplace_back(tri.v2.x);
        positions.emplace_back(tri.v2.y);
        positions.emplace_back(tri.v2.z);

        positions.emplace_back(tri.v3.x);
        positions.emplace_back(tri.v3.y);
        positions.emplace_back(tri.v3.z);

        for (int i = 0; i < 3; ++i) {
            normals.emplace_back(tri.normal.x);
            normals.emplace_back(tri.normal.y);
            normals.emplace_back(tri.normal.z);
        }
    }

    root["positions"] = positions;
    root["normals"] = normals;
    root["normals_recomputed_count"] = static_cast<int64_t>(recomputed_count);

    Json units;
    units["position"] = "m";
    root["units"] = units;

    return HttpResponse::ok_json(root);
}

HttpResponse ApiRouter::handle_parse_csv(const HttpRequest& req) {
    std::string content = extract_content(req);
    if (content.empty()) {
        return HttpResponse::error_json(400, "Bad Request", "CSV content payload is empty.");
    }

    uew::parsers::TemperatureDataset dataset;
    try {
        dataset = uew::parsers::CsvParser::parse_csv(content);
    } catch (const std::invalid_argument& e) {
        return HttpResponse::error_json(400, "CSV Parsing Error", e.what());
    } catch (const std::exception& e) {
        return HttpResponse::error_json(500, "Internal Server Error", e.what());
    }

    Json root;
    root["status"] = "ok";
    root["node_count"] = static_cast<int64_t>(dataset.node_count);
    root["is_synthetic"] = dataset.is_synthetic;
    root["provenance"] = dataset.provenance;

    Json bbox;
    std::vector<Json> bbox_min{ dataset.bbox.min.x, dataset.bbox.min.y, dataset.bbox.min.z };
    std::vector<Json> bbox_max{ dataset.bbox.max.x, dataset.bbox.max.y, dataset.bbox.max.z };
    std::vector<Json> bbox_dim{
        dataset.bbox.max.x - dataset.bbox.min.x,
        dataset.bbox.max.y - dataset.bbox.min.y,
        dataset.bbox.max.z - dataset.bbox.min.z
    };
    bbox["min"] = bbox_min;
    bbox["max"] = bbox_max;
    bbox["dimensions"] = bbox_dim;
    root["bbox"] = bbox;

    Json stats;
    stats["min_temperature_C"] = dataset.min_temperature_C;
    stats["max_temperature_C"] = dataset.max_temperature_C;
    stats["avg_temperature_C"] = dataset.avg_temperature_C;
    root["temperature_stats"] = stats;

    std::vector<Json> node_ids;
    node_ids.reserve(dataset.nodes.size());
    std::vector<Json> positions;
    positions.reserve(dataset.nodes.size() * 3);
    std::vector<Json> temperatures;
    temperatures.reserve(dataset.nodes.size());

    for (const auto& n : dataset.nodes) {
        node_ids.emplace_back(n.node_id);
        positions.emplace_back(n.x_m);
        positions.emplace_back(n.y_m);
        positions.emplace_back(n.z_m);
        temperatures.emplace_back(n.temperature_C);
    }

    root["node_ids"] = node_ids;
    root["positions"] = positions;
    root["temperatures_C"] = temperatures;

    Json units;
    units["position"] = "m";
    units["temperature"] = "degC";
    root["units"] = units;

    return HttpResponse::ok_json(root);
}

namespace {

uew::benchmark::BenchmarkConfig parse_benchmark_config(const HttpRequest& req) {
    uew::benchmark::BenchmarkConfig cfg;

    std::string q_cases = req.get_query_param("case_count");
    if (!q_cases.empty()) {
        try { cfg.case_count = std::stoi(q_cases); } catch (...) {}
    }
    std::string q_elem = req.get_query_param("elements");
    if (!q_elem.empty()) {
        try { cfg.elements = std::stoi(q_elem); } catch (...) {}
    }
    std::string q_seed = req.get_query_param("seed");
    if (!q_seed.empty()) {
        try { cfg.seed = static_cast<uint32_t>(std::stoul(q_seed)); } catch (...) {}
    }
    std::string q_rep = req.get_query_param("repetitions");
    if (!q_rep.empty()) {
        try { cfg.repetitions = std::stoi(q_rep); } catch (...) {}
    }

    if (!req.body.empty() && req.body.front() == '{') {
        try {
            Json body = Json::parse(req.body);
            if (body.contains("case_count") && body["case_count"].is_number()) {
                cfg.case_count = static_cast<int>(body["case_count"].as_number());
            }
            if (body.contains("elements") && body["elements"].is_number()) {
                cfg.elements = static_cast<int>(body["elements"].as_number());
            }
            if (body.contains("seed") && body["seed"].is_number()) {
                cfg.seed = static_cast<uint32_t>(body["seed"].as_number());
            }
            if (body.contains("repetitions") && body["repetitions"].is_number()) {
                cfg.repetitions = static_cast<int>(body["repetitions"].as_number());
            }
            if (body.contains("worker_counts") && body["worker_counts"].is_array()) {
                cfg.worker_counts.clear();
                for (const auto& w : body["worker_counts"].as_array()) {
                    if (w.is_number()) {
                        cfg.worker_counts.push_back(static_cast<int>(w.as_number()));
                    }
                }
                if (cfg.worker_counts.empty()) {
                    cfg.worker_counts = {1, 2, 4};
                }
            }
        } catch (...) {
            // Malformed body will trigger validation below
        }
    }

    return cfg;
}

} // namespace

HttpResponse ApiRouter::handle_benchmark_run(const HttpRequest& req) {
    auto cfg = parse_benchmark_config(req);

    if (cfg.case_count <= 0 || cfg.case_count > 50000) {
        return HttpResponse::error_json(400, "Bad Request", "case_count must be an integer between 1 and 50,000");
    }
    if (cfg.elements <= 0 || cfg.elements > 1000) {
        return HttpResponse::error_json(400, "Bad Request", "elements must be an integer between 1 and 1,000");
    }
    if (cfg.repetitions <= 0 || cfg.repetitions > 20) {
        return HttpResponse::error_json(400, "Bad Request", "repetitions must be an integer between 1 and 20");
    }

    auto suite = uew::benchmark::BenchmarkHarness::runSuite(cfg);

    Json root;
    root["status"] = "ok";

    Json j_config;
    j_config["case_count"] = suite.config.case_count;
    j_config["elements"] = suite.config.elements;
    j_config["repetitions"] = suite.config.repetitions;
    j_config["seed"] = static_cast<int64_t>(suite.config.seed);
    root["config"] = j_config;

    Json j_env;
    j_env["cpu_model"] = suite.environment.cpu_model;
    j_env["logical_cores"] = static_cast<int64_t>(suite.environment.logical_cores);
    j_env["physical_cores"] = static_cast<int64_t>(suite.environment.physical_cores);
    j_env["total_ram_bytes"] = static_cast<int64_t>(suite.environment.total_ram_bytes);
    j_env["compiler"] = suite.environment.compiler;
    j_env["build_mode"] = suite.environment.build_mode;
    j_env["timer_clock"] = suite.environment.timer_clock;
    j_env["timing_scope"] = suite.environment.timing_scope;
    root["environment"] = j_env;

    std::vector<Json> j_workers;
    for (const auto& w : suite.worker_results) {
        Json jw;
        jw["worker_count"] = w.worker_count;
        jw["is_serial_baseline"] = w.is_serial_baseline;

        std::vector<Json> j_reps;
        for (double r : w.repetition_ms) {
            j_reps.emplace_back(r);
        }
        jw["repetition_ms"] = j_reps;
        jw["median_ms"] = w.median_ms;
        jw["speedup"] = w.speedup;
        jw["efficiency"] = w.efficiency;
        jw["max_discrepancy_vs_serial_C"] = w.max_discrepancy_vs_serial_C;
        jw["numerical_agreement_passed"] = w.numerical_agreement_passed;

        j_workers.push_back(jw);
    }
    root["worker_results"] = j_workers;

    root["max_global_discrepancy_C"] = suite.max_global_discrepancy_C;
    root["numerical_agreement_passed"] = suite.numerical_agreement_passed;
    root["all_passed"] = suite.all_passed;
    root["notes"] = suite.notes;

    return HttpResponse::ok_json(root);
}

HttpResponse ApiRouter::handle_benchmark_export(const HttpRequest& req) {
    auto cfg = parse_benchmark_config(req);

    if (cfg.case_count <= 0 || cfg.case_count > 50000) {
        return HttpResponse::error_json(400, "Bad Request", "case_count must be an integer between 1 and 50,000");
    }
    if (cfg.elements <= 0 || cfg.elements > 1000) {
        return HttpResponse::error_json(400, "Bad Request", "elements must be an integer between 1 and 1,000");
    }
    if (cfg.repetitions <= 0 || cfg.repetitions > 20) {
        return HttpResponse::error_json(400, "Bad Request", "repetitions must be an integer between 1 and 20");
    }

    auto suite = uew::benchmark::BenchmarkHarness::runSuite(cfg);
    std::string csv = uew::benchmark::BenchmarkHarness::exportBenchmarkCsv(suite);

    HttpResponse res;
    res.status_code = 200;
    res.status_text = "OK";
    res.headers["Content-Type"] = "text/csv; charset=utf-8";
    res.headers["Content-Disposition"] = "attachment; filename=\"benchmark_results.csv\"";
    res.body = csv;
    return res;
}

} // namespace uew::api
