#include "ApiRouter.h"
#include <chrono>

#ifdef _WIN32
#include <windows.h>
#else
#include <unistd.h>
#endif

namespace uew::api {

void ApiRouter::register_routes(HttpServer& server) {
    server.set_route("GET", "/api/v1/health", &ApiRouter::handle_health);
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

} // namespace uew::api

