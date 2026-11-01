#include "MockMcuAdapter.h"
#include <chrono>

namespace uew::embedded {

MockMcuAdapter::MockMcuAdapter() = default;

DeviceInfo MockMcuAdapter::get_info() const {
    DeviceInfo info;
    info.id = "mcu";
    info.name = "STMicroelectronics NUCLEO-F401RE";
    info.category = "Microcontroller Board";
    info.target_silicon = "STM32F401RET6 (ARM Cortex-M4 @ 84 MHz)";
    info.description = "Simulated host-connected ARM Cortex-M4 microcontroller evaluation board.";
    info.host_interface = "Virtual COM Port (USB CDC ACM @ 115200 baud)";
    info.power_domains = "Single 3.3V LVCMOS rail (via USB 5V LDO)";
    info.physical_connectors = "Arduino Uno R3 & ST Morpho extension headers";
    info.is_simulated = true;
    return info;
}

HardwareCapabilities MockMcuAdapter::get_capabilities() const {
    HardwareCapabilities caps;
    caps.supported_protocols = {
        "USB CDC ACM (115200 baud)",
        "USART (PA9/PA10)",
        "SWD / JTAG (CoreSight)"
    };
    caps.voltage_rails = {
        "VDD = 3.3V LVCMOS (Core & I/O)",
        "5.0V USB VBUS Input"
    };
    caps.target_interfaces = {
        "CN10 ST Morpho Header (PA9 TX, PA10 RX)",
        "CN2 SWD Dedicated Debug Header"
    };
    caps.jtag_role = "Scan Chain TAP #1 (Illustrative custom daisy chain)";
    caps.interconnect_note = "Proposed custom interconnect: PA9 TX/PA10 RX on CN10 to Basys 3 Pmod JA. Conceptual unverified mapping, not a validated physical wiring design.";
    return caps;
}

bool MockMcuAdapter::connect() {
    if (faulted_) {
        return false;
    }
    state_ = DeviceState::Connected;
    return true;
}

bool MockMcuAdapter::disconnect() {
    if (faulted_) {
        pre_fault_state_ = DeviceState::Disconnected;
        return true;
    }
    state_ = DeviceState::Disconnected;
    return true;
}

TelemetryResult MockMcuAdapter::get_telemetry() {
    TelemetryResult res;
    if (faulted_) {
        res.success = false;
        res.error_code = "COMMUNICATION_TIMEOUT";
        res.error_message = "Simulated communication timeout on STM32F401RE: no response received from simulated device.";
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
    res.data.device_id = "mcu";
    auto now = std::chrono::system_clock::now();
    res.data.timestamp_ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();
    res.data.is_simulated = true;
    res.data.status = "ok";

    // Fixed deterministic telemetry baseline per approved specification
    res.data.numeric_metrics["junction_temperature_C"] = 38.5;
    res.data.numeric_metrics["vdd_voltage_V"] = 3.30;
    res.data.numeric_metrics["cpu_utilization_pct"] = 15.0;
    res.data.numeric_metrics["heartbeat_count"] = 100.0;

    res.data.text_metrics["firmware_version"] = "v1.4.2-mock";
    res.data.text_metrics["operating_mode"] = "Run Mode (84 MHz PLL)";

    return res;
}

void MockMcuAdapter::inject_fault(const std::string& fault_type) {
    if (!faulted_) {
        pre_fault_state_ = state_;
        faulted_ = true;
        state_ = DeviceState::Faulted;
        fault_type_ = fault_type;
    }
}

void MockMcuAdapter::clear_fault() {
    if (faulted_) {
        faulted_ = false;
        state_ = pre_fault_state_; // Strictly restore pre-fault state
        fault_type_.clear();
    }
}

} // namespace uew::embedded
