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
};

} // namespace uew::api

