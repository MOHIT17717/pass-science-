#include "api/HttpServer.h"
#include "api/ApiRouter.h"
#include <iostream>
#include <string>
#include <thread>
#include <csignal>

#ifdef _WIN32
#include <windows.h>
#else
#include <unistd.h>
#endif

static uew::api::HttpServer* g_server = nullptr;

static void signal_handler(int sig) {
    if (g_server) {
        std::cout << "[BACKEND] Signal " << sig << " received. Stopping server." << std::endl;
        g_server->stop();
    }
}

int main(int argc, char* argv[]) {
    // Default to port 0 (dynamic loopback port allocation by Windows kernel)
    int requested_port = 0;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--port" && i + 1 < argc) {
            requested_port = std::stoi(argv[++i]);
        }
    }

    uew::api::HttpServer server(requested_port);
    g_server = &server;

    // Enforce authentication requirement (protected until INIT_TOKEN is received over stdin)
    server.set_require_auth(true);

    // Register all versioned routes
    uew::api::ApiRouter::register_routes(server);

    std::signal(SIGINT, signal_handler);
    std::signal(SIGTERM, signal_handler);

    // 1. Start server strictly on loopback (127.0.0.1)
    if (!server.start(false)) {
        std::cerr << "[BACKEND ERROR] Could not bind server on loopback port " << requested_port << std::endl;
        return 1;
    }

    int bound_port = server.get_bound_port();
#ifdef _WIN32
    DWORD pid = GetCurrentProcessId();
#else
    pid_t pid = getpid();
#endif

    // 2. Announce readiness & bound port to Electron Main Process
    std::cout << "[BACKEND READY] port=" << bound_port << " pid=" << pid << std::endl;
    std::cout.flush();

    // 3. Background stdin monitoring thread for secure token handshake and graceful shutdown
    std::thread stdin_thread([&server]() {
        std::string line;
        while (std::getline(std::cin, line)) {
            if (!line.empty() && line.back() == '\r') line.pop_back();

            if (line.rfind("INIT_TOKEN ", 0) == 0) {
                std::string token = line.substr(11);
                if (!token.empty()) {
                    server.set_auth_token(token);
                    // Announce token initialization complete to Electron without logging the token
                    std::cout << "[TOKEN READY]" << std::endl;
                    std::cout.flush();
                }
            } else if (line == "SHUTDOWN") {
                std::cout << "[BACKEND] Received SHUTDOWN signal on stdin. Terminating gracefully." << std::endl;
                std::cout.flush();
                server.stop();
                break;
            }
        }

        if (std::cin.eof()) {
            std::cout << "[BACKEND] Parent process pipe closed (EOF). Terminating." << std::endl;
            std::cout.flush();
            server.stop();
        }
    });

    // 4. Wait for server stop signal
    while (server.is_running()) {
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
    }

    if (stdin_thread.joinable()) {
        stdin_thread.detach();
    }

    std::cout << "[BACKEND] Process exiting cleanly with exit code 0." << std::endl;
    return 0;
}
