#include "MockJtagAdapter.h"
#include <chrono>

namespace uew::embedded {

MockJtagAdapter::MockJtagAdapter() = default;

DeviceInfo MockJtagAdapter::get_info() const {
    DeviceInfo info;
    info.id = "jtag";
    info.name = "SEGGER J-Link BASE";
    info.category = "JTAG / SWD Debug Probe";
    info.target_silicon = "N/A (External Host Debug Probe)";
    info.description = "Simulated host-controlled hardware debug probe with target voltage sensing and active JTAG bus mastering.";
    info.host_interface = "USB 2.0 High-Speed (480 Mbps SEGGER Host Driver)";
    info.power_domains = "Target Voltage Reference (VTref) auto-sensing: 1.2V to 5.0V range";
    info.physical_connectors = "Standard 20-pin 0.1\" (2.54mm) IDC target ribbon header";
    info.is_simulated = true;
    return info;
}

HardwareCapabilities MockJtagAdapter::get_capabilities() const {
    HardwareCapabilities caps;
    caps.supported_protocols = {
        "JTAG (IEEE 1149.1)",
        "SWD (Serial Wire Debug)"
    };
    caps.voltage_rails = {
        "VTref = 1.2V - 5.0V auto-sense"
    };
    caps.target_interfaces = {
        "20-pin IDC Header (TCK, TMS, TDI, TDO, VTref, GND)"
    };
    caps.jtag_role = "Bus Master (Drives TCK/TMS/TDI, samples TDO/VTref)";
    caps.interconnect_note = "JTAG adapter is a debug probe, NOT a generic compute board. The shared multi-device scan chain is an illustrative custom test topology, not a standard factory configuration.";
    return caps;
}

bool MockJtagAdapter::connect() {
    if (faulted_) {
        return false;
    }
    state_ = DeviceState::Connected;
    return true;
}

bool MockJtagAdapter::disconnect() {
    if (faulted_) {
        pre_fault_state_ = DeviceState::Disconnected;
        return true;
    }
    state_ = DeviceState::Disconnected;
    return true;
}

TelemetryResult MockJtagAdapter::get_telemetry() {
    TelemetryResult res;
    if (faulted_) {
        res.success = false;
        res.error_code = "COMMUNICATION_TIMEOUT";
        res.error_message = "Simulated communication timeout on SEGGER J-Link BASE: no response received from simulated debug probe.";
        res.recoverable = true;
        return res;
    }

    if (state_ != DeviceState::Connected) {
        res.success = false;
        res.error_code = "DEVICE_NOT_CONNECTED";
        res.error_message = "Device is not connected. Call connect() before querying telemetry.";
        res.recoverable = true;
        return res;
    }

    res.success = true;
    res.data.device_id = "jtag";
    auto now = std::chrono::system_clock::now();
    res.data.timestamp_ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();
    res.data.is_simulated = true;
    res.data.status = "ok";

    // Fixed deterministic telemetry baseline per approved specification
    res.data.numeric_metrics["vtref_sense_voltage_V"] = 3.30;
    res.data.numeric_metrics["tck_frequency_MHz"] = 4.0;
    res.data.numeric_metrics["detected_tap_count"] = 2.0;
    res.data.numeric_metrics["scan_errors_count"] = 0.0;

    res.data.text_metrics["bus_integrity"] = "OK";
    res.data.text_metrics["tap_0_identity"] = "Xilinx Artix-7 FPGA TAP";
    res.data.text_metrics["tap_1_identity"] = "ARM Cortex-M4 CoreSight TAP";

    return res;
}

void MockJtagAdapter::inject_fault(const std::string& fault_type) {
    if (!faulted_) {
        pre_fault_state_ = state_;
        faulted_ = true;
        state_ = DeviceState::Faulted;
        fault_type_ = fault_type;
    }
}

void MockJtagAdapter::clear_fault() {
    if (faulted_) {
        faulted_ = false;
        state_ = pre_fault_state_; // Strictly restore pre-fault state
        fault_type_.clear();
    }
}

} // namespace uew::embedded
