#include "MockFpgaAdapter.h"
#include <chrono>

namespace uew::embedded {

MockFpgaAdapter::MockFpgaAdapter() = default;

DeviceInfo MockFpgaAdapter::get_info() const {
    DeviceInfo info;
    info.id = "fpga";
    info.name = "Digilent Basys 3";
    info.category = "FPGA Evaluation Board";
    info.target_silicon = "AMD / Xilinx Artix-7 XC7A35T-1CPG236C";
    info.description = "Simulated host-connected Xilinx Artix-7 FPGA development board with multi-rail power architecture.";
    info.host_interface = "FTDI FT2232HQ USB-to-UART (Channel B @ 115200 baud)";
    info.power_domains = "Multi-rail: VCCINT 1.0V (Core) | VCCAUX 1.8V (Auxiliary) | VCCO 3.3V (I/O Banks 0,14,15,34,35)";
    info.physical_connectors = "4x 12-pin Digilent Pmod headers (JA, JB, JC, JXADC) & Micro-B USB";
    info.is_simulated = true;
    return info;
}

HardwareCapabilities MockFpgaAdapter::get_capabilities() const {
    HardwareCapabilities caps;
    caps.supported_protocols = {
        "UART via FTDI FT2232HQ (115200 baud)",
        "JTAG via FTDI FT2232HQ Channel A",
        "Pmod GPIO/UART (3.3V LVCMOS)"
    };
    caps.voltage_rails = {
        "VCCINT = 1.0V (Core Logic)",
        "VCCAUX = 1.8V (Auxiliary & Clock Managers)",
        "VCCO = 3.3V (I/O Banks 0, 14, 15, 34, 35)"
    };
    caps.target_interfaces = {
        "Pmod JA Header (Pins J1/L2)",
        "Onboard FTDI USB-JTAG"
    };
    caps.jtag_role = "Scan Chain TAP #0 (Illustrative custom daisy chain)";
    caps.interconnect_note = "Pmod JA connects to FPGA Bank 14 (3.3V LVCMOS). MCU UART interconnect is an illustrative proposed concept; level translation is unnecessary for 3.3V-to-3.3V, but shared GND is required.";
    return caps;
}

bool MockFpgaAdapter::connect() {
    if (faulted_) {
        return false;
    }
    state_ = DeviceState::Connected;
    return true;
}

bool MockFpgaAdapter::disconnect() {
    if (faulted_) {
        pre_fault_state_ = DeviceState::Disconnected;
        return true;
    }
    state_ = DeviceState::Disconnected;
    return true;
}

TelemetryResult MockFpgaAdapter::get_telemetry() {
    TelemetryResult res;
    if (faulted_) {
        res.success = false;
        res.error_code = "COMMUNICATION_TIMEOUT";
        res.error_message = "Simulated communication timeout on Digilent Basys 3: no response received from simulated device.";
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
    res.data.device_id = "fpga";
    auto now = std::chrono::system_clock::now();
    res.data.timestamp_ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();
    res.data.is_simulated = true;
    res.data.status = "ok";

    // Fixed deterministic telemetry baseline per approved specification
    res.data.numeric_metrics["xadc_die_temperature_C"] = 44.0;
    res.data.numeric_metrics["vccint_voltage_V"] = 1.00;
    res.data.numeric_metrics["vccaux_voltage_V"] = 1.80;
    res.data.numeric_metrics["vcco_voltage_V"] = 3.30;
    res.data.numeric_metrics["lut_utilization_pct"] = 28.4;

    res.data.text_metrics["config_status"] = "DONE=1, INIT_B=1";
    res.data.text_metrics["bitstream_crc"] = "PASS";

    return res;
}

void MockFpgaAdapter::inject_fault(const std::string& fault_type) {
    if (!faulted_) {
        pre_fault_state_ = state_;
        faulted_ = true;
        state_ = DeviceState::Faulted;
        fault_type_ = fault_type;
    }
}

void MockFpgaAdapter::clear_fault() {
    if (faulted_) {
        faulted_ = false;
        state_ = pre_fault_state_; // Strictly restore pre-fault state
        fault_type_.clear();
    }
}

} // namespace uew::embedded
