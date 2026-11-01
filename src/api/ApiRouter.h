#pragma once

#include "HttpServer.h"

namespace uew::api {

/**
 * High-level API router mapping versioned HTTP endpoints to core engineering handlers.
 */
class ApiRouter {
public:
    static void register_routes(HttpServer& server);

    // Endpoint handlers
    static HttpResponse handle_health(const HttpRequest& req);
    static HttpResponse handle_thermal_solve(const HttpRequest& req);
    static HttpResponse handle_thermal_export(const HttpRequest& req);
    static HttpResponse handle_parse_stl(const HttpRequest& req);
    static HttpResponse handle_parse_csv(const HttpRequest& req);
    static HttpResponse handle_benchmark_run(const HttpRequest& req);
    static HttpResponse handle_benchmark_export(const HttpRequest& req);

    // Embedded endpoints (Task 11)
    static HttpResponse handle_embedded_devices(const HttpRequest& req);
    static HttpResponse handle_embedded_connect(const HttpRequest& req);
    static HttpResponse handle_embedded_disconnect(const HttpRequest& req);
    static HttpResponse handle_embedded_telemetry(const HttpRequest& req);
    static HttpResponse handle_embedded_fault(const HttpRequest& req);

    // Backpropagation endpoints (Task 11)
    static HttpResponse handle_backprop_train(const HttpRequest& req);
    static HttpResponse handle_backprop_export(const HttpRequest& req);
};

} // namespace uew::api

