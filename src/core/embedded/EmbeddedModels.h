#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include <cstdint>

namespace uew::embedded {

/**
 * Explicit operational state of a simulated embedded device.
 */
enum class DeviceState {
    Disconnected,
    Connected,
    Faulted
};

inline std::string to_string(DeviceState state) {
    switch (state) {
        case DeviceState::Connected: return "connected";
        case DeviceState::Faulted: return "faulted";
        case DeviceState::Disconnected:
        default: return "disconnected";
    }
}

inline DeviceState device_state_from_string(const std::string& str) {
    if (str == "connected") return DeviceState::Connected;
    if (str == "faulted") return DeviceState::Faulted;
    return DeviceState::Disconnected;
}

/**
 * Metadata and specification describing a simulated embedded device.
 */
struct DeviceInfo {
    std::string id;              // "mcu", "fpga", "jtag"
    std::string name;            // e.g. "STMicroelectronics NUCLEO-F401RE"
    std::string category;        // e.g. "Microcontroller Board"
    std::string target_silicon;  // e.g. "STM32F401RET6 (ARM Cortex-M4 @ 84 MHz)"
    std::string description;
    std::string host_interface;  // e.g. "Virtual COM Port (USB CDC ACM @ 115200 baud)"
    std::string power_domains;   // e.g. "Single 3.3V LVCMOS rail (via USB 5V LDO)"
    std::string physical_connectors; // e.g. "Arduino Uno R3 & ST Morpho extension headers"
    bool is_simulated = true;
};

/**
 * Capabilities and technical boundaries of a simulated device.
 */
struct HardwareCapabilities {
    std::vector<std::string> supported_protocols;
    std::vector<std::string> voltage_rails;
    std::vector<std::string> target_interfaces;
    std::string jtag_role;          // e.g. "Bus Master", "Scan Chain TAP #0", "Scan Chain TAP #1"
    std::string interconnect_note;  // Clarification on custom/unverified interconnects
};

/**
 * Fixed deterministic telemetry snapshot.
 */
struct TelemetryData {
    std::string device_id;
    int64_t timestamp_ms = 0;
    std::unordered_map<std::string, double> numeric_metrics;
    std::unordered_map<std::string, std::string> text_metrics;
    std::string status = "ok";
    bool is_simulated = true;
};

/**
 * Result structure returned by telemetry queries, containing structured error info if faulted.
 */
struct TelemetryResult {
    bool success = true;
    TelemetryData data;
    std::string error_code;
    std::string error_message;
    bool recoverable = true;
};

} // namespace uew::embedded
