#include "core/embedded/EmbeddedController.h"
#include <iostream>
#include <cassert>
#include <cmath>

using namespace uew::embedded;

static int g_failed = 0;
static int g_passed = 0;

#define TEST_ASSERT(cond, msg) \
    do { \
        if (!(cond)) { \
            std::cerr << "FAILED: " << msg << " (" << __FILE__ << ":" << __LINE__ << ")\n"; \
            g_failed++; \
        } else { \
            g_passed++; \
        } \
    } while (0)

void test_discovery_three_devices() {
    EmbeddedController ctrl;
    auto devices = ctrl.get_devices();
    TEST_ASSERT(devices.size() == 3, "Embedded discovery must return exactly 3 devices");

    bool has_mcu = false;
    bool has_fpga = false;
    bool has_jtag = false;

    for (const auto& d : devices) {
        TEST_ASSERT(d.is_simulated, "All devices must be explicitly marked as simulated");
        if (d.id == "mcu") {
            has_mcu = true;
            TEST_ASSERT(d.name.find("NUCLEO-F401RE") != std::string::npos, "MCU name check");
            TEST_ASSERT(d.category == "Microcontroller Board", "MCU category check");
        } else if (d.id == "fpga") {
            has_fpga = true;
            TEST_ASSERT(d.name.find("Basys 3") != std::string::npos, "FPGA name check");
            TEST_ASSERT(d.category == "FPGA Evaluation Board", "FPGA category check");
        } else if (d.id == "jtag") {
            has_jtag = true;
            TEST_ASSERT(d.name.find("J-Link") != std::string::npos, "JTAG name check");
            TEST_ASSERT(d.category == "JTAG / SWD Debug Probe", "JTAG category check");
        }
    }

    TEST_ASSERT(has_mcu && has_fpga && has_jtag, "Must discover MCU, FPGA, and JTAG");
}

void test_domain_specifications() {
    EmbeddedController ctrl;
    auto caps_list = ctrl.get_all_capabilities();
    TEST_ASSERT(caps_list.size() == 3, "Must have capabilities for all 3 devices");

    auto devices = ctrl.get_devices();
    for (size_t i = 0; i < devices.size(); ++i) {
        const auto& d = devices[i];
        const auto& caps = caps_list[i];

        if (d.id == "mcu") {
            TEST_ASSERT(d.power_domains.find("3.3V") != std::string::npos, "MCU must specify 3.3V rail");
            TEST_ASSERT(d.physical_connectors.find("ST Morpho") != std::string::npos, "MCU must specify ST Morpho connectors");
            TEST_ASSERT(caps.interconnect_note.find("Proposed custom interconnect") != std::string::npos, "MCU must label UART as proposed custom interconnect");
        } else if (d.id == "fpga") {
            TEST_ASSERT(d.power_domains.find("VCCINT 1.0V") != std::string::npos, "FPGA must document VCCINT 1.0V");
            TEST_ASSERT(d.power_domains.find("VCCAUX 1.8V") != std::string::npos, "FPGA must document VCCAUX 1.8V");
            TEST_ASSERT(d.power_domains.find("VCCO 3.3V") != std::string::npos, "FPGA must document VCCO 3.3V");
            TEST_ASSERT(caps.interconnect_note.find("Bank 14") != std::string::npos, "FPGA must document Bank 14 Pmod rail");
        } else if (d.id == "jtag") {
            TEST_ASSERT(d.power_domains.find("1.2V to 5.0V") != std::string::npos, "JTAG must document VTref sense range");
            TEST_ASSERT(caps.jtag_role.find("Bus Master") != std::string::npos, "JTAG must be designated Bus Master");
            TEST_ASSERT(caps.interconnect_note.find("illustrative custom test topology") != std::string::npos, "JTAG must label daisy chain as illustrative custom topology");
        }
    }
}

void test_lifecycle_and_deterministic_telemetry() {
    EmbeddedController ctrl;

    // Disconnected state by default
    TEST_ASSERT(ctrl.get_device_state("mcu") == DeviceState::Disconnected, "Default state is Disconnected");
    auto telem_before = ctrl.get_device_telemetry("mcu");
    TEST_ASSERT(!telem_before.success, "Telemetry on disconnected device must fail");
    TEST_ASSERT(telem_before.error_code == "DEVICE_NOT_CONNECTED", "Error code must be DEVICE_NOT_CONNECTED");

    // Connect all
    TEST_ASSERT(ctrl.connect_device("mcu"), "Connect MCU must succeed");
    TEST_ASSERT(ctrl.connect_device("fpga"), "Connect FPGA must succeed");
    TEST_ASSERT(ctrl.connect_device("jtag"), "Connect JTAG must succeed");

    TEST_ASSERT(ctrl.get_device_state("mcu") == DeviceState::Connected, "MCU state is Connected");
    TEST_ASSERT(ctrl.get_device_state("fpga") == DeviceState::Connected, "FPGA state is Connected");
    TEST_ASSERT(ctrl.get_device_state("jtag") == DeviceState::Connected, "JTAG state is Connected");

    // Verify fixed deterministic telemetry
    auto mcu_telem = ctrl.get_device_telemetry("mcu");
    TEST_ASSERT(mcu_telem.success, "MCU telemetry query must succeed");
    TEST_ASSERT(mcu_telem.data.numeric_metrics["junction_temperature_C"] == 38.5, "MCU temp == 38.5 C");
    TEST_ASSERT(mcu_telem.data.numeric_metrics["vdd_voltage_V"] == 3.30, "MCU VDD == 3.30 V");
    TEST_ASSERT(mcu_telem.data.numeric_metrics["cpu_utilization_pct"] == 15.0, "MCU CPU == 15.0%");
    TEST_ASSERT(mcu_telem.data.text_metrics["firmware_version"] == "v1.4.2-mock", "MCU firmware string");

    auto fpga_telem = ctrl.get_device_telemetry("fpga");
    TEST_ASSERT(fpga_telem.success, "FPGA telemetry query must succeed");
    TEST_ASSERT(fpga_telem.data.numeric_metrics["xadc_die_temperature_C"] == 44.0, "FPGA temp == 44.0 C");
    TEST_ASSERT(fpga_telem.data.numeric_metrics["vccint_voltage_V"] == 1.00, "FPGA VCCINT == 1.00 V");
    TEST_ASSERT(fpga_telem.data.numeric_metrics["vccaux_voltage_V"] == 1.80, "FPGA VCCAUX == 1.80 V");
    TEST_ASSERT(fpga_telem.data.numeric_metrics["vcco_voltage_V"] == 3.30, "FPGA VCCO == 3.30 V");
    TEST_ASSERT(fpga_telem.data.text_metrics["bitstream_crc"] == "PASS", "FPGA bitstream CRC");

    auto jtag_telem = ctrl.get_device_telemetry("jtag");
    TEST_ASSERT(jtag_telem.success, "JTAG telemetry query must succeed");
    TEST_ASSERT(jtag_telem.data.numeric_metrics["vtref_sense_voltage_V"] == 3.30, "JTAG VTref == 3.30 V");
    TEST_ASSERT(jtag_telem.data.numeric_metrics["tck_frequency_MHz"] == 4.0, "JTAG TCK == 4.0 MHz");
    TEST_ASSERT(jtag_telem.data.numeric_metrics["detected_tap_count"] == 2.0, "JTAG TAP count == 2");
    TEST_ASSERT(jtag_telem.data.text_metrics["bus_integrity"] == "OK", "JTAG bus integrity");

    // Disconnect
    TEST_ASSERT(ctrl.disconnect_device("mcu"), "Disconnect MCU");
    TEST_ASSERT(ctrl.get_device_state("mcu") == DeviceState::Disconnected, "MCU disconnected");
}

void test_fault_lifecycle_and_no_silent_autoconnect() {
    EmbeddedController ctrl;

    // Test Case A: Inject fault on DISCONNECTED device
    TEST_ASSERT(ctrl.get_device_state("mcu") == DeviceState::Disconnected, "MCU starts disconnected");
    TEST_ASSERT(ctrl.inject_fault("mcu", "timeout"), "Inject fault on disconnected MCU");
    TEST_ASSERT(ctrl.get_device_state("mcu") == DeviceState::Faulted, "MCU state transitions to Faulted");

    // Attempting to connect or read telemetry while faulted must fail
    TEST_ASSERT(!ctrl.connect_device("mcu"), "Connect on faulted device must fail");
    auto telem_err = ctrl.get_device_telemetry("mcu");
    TEST_ASSERT(!telem_err.success, "Telemetry on faulted device must fail");
    TEST_ASSERT(telem_err.error_code == "COMMUNICATION_TIMEOUT", "Error must be COMMUNICATION_TIMEOUT");
    TEST_ASSERT(telem_err.recoverable, "Fault must be marked recoverable");

    // Clear fault: MUST restore to pre-fault state (Disconnected), NOT auto-connect!
    TEST_ASSERT(ctrl.clear_fault("mcu"), "Clear fault on MCU");
    TEST_ASSERT(ctrl.get_device_state("mcu") == DeviceState::Disconnected, "CRITICAL: Clearing fault must leave previously disconnected device Disconnected (no silent auto-connect)");

    // Test Case B: Inject fault on CONNECTED device
    TEST_ASSERT(ctrl.connect_device("mcu"), "Connect MCU");
    TEST_ASSERT(ctrl.get_device_state("mcu") == DeviceState::Connected, "MCU is now Connected");
    TEST_ASSERT(ctrl.inject_fault("mcu", "timeout"), "Inject fault on connected MCU");
    TEST_ASSERT(ctrl.get_device_state("mcu") == DeviceState::Faulted, "MCU state transitions to Faulted");

    telem_err = ctrl.get_device_telemetry("mcu");
    TEST_ASSERT(!telem_err.success, "Telemetry must fail while faulted");
    TEST_ASSERT(telem_err.error_code == "COMMUNICATION_TIMEOUT", "Timeout error code");

    // Clear fault: MUST restore to pre-fault state (Connected)
    TEST_ASSERT(ctrl.clear_fault("mcu"), "Clear fault on MCU");
    TEST_ASSERT(ctrl.get_device_state("mcu") == DeviceState::Connected, "Clearing fault on previously connected device restores Connected state");
    auto telem_ok = ctrl.get_device_telemetry("mcu");
    TEST_ASSERT(telem_ok.success, "Telemetry succeeds after recovery");
}

void test_fault_isolation() {
    EmbeddedController ctrl;

    // Connect all three devices
    ctrl.connect_device("mcu");
    ctrl.connect_device("fpga");
    ctrl.connect_device("jtag");

    // Inject fault into MCU only
    TEST_ASSERT(ctrl.inject_fault("mcu", "timeout"), "Inject timeout into MCU");
    TEST_ASSERT(ctrl.get_device_state("mcu") == DeviceState::Faulted, "MCU is Faulted");

    // Fault isolation check: FPGA and JTAG must remain Connected and fully functional
    TEST_ASSERT(ctrl.get_device_state("fpga") == DeviceState::Connected, "FPGA remains Connected");
    TEST_ASSERT(ctrl.get_device_state("jtag") == DeviceState::Connected, "JTAG remains Connected");

    auto fpga_telem = ctrl.get_device_telemetry("fpga");
    TEST_ASSERT(fpga_telem.success, "FPGA telemetry must succeed without interference");
    TEST_ASSERT(fpga_telem.data.numeric_metrics["vccint_voltage_V"] == 1.00, "FPGA VCCINT intact");

    auto jtag_telem = ctrl.get_device_telemetry("jtag");
    TEST_ASSERT(jtag_telem.success, "JTAG telemetry must succeed without interference");
    TEST_ASSERT(jtag_telem.data.numeric_metrics["tck_frequency_MHz"] == 4.0, "JTAG TCK intact");

    // Clear MCU fault
    ctrl.clear_fault("mcu");
    TEST_ASSERT(ctrl.get_device_state("mcu") == DeviceState::Connected, "MCU recovered");
    TEST_ASSERT(ctrl.get_device_state("fpga") == DeviceState::Connected, "FPGA still Connected");
    TEST_ASSERT(ctrl.get_device_state("jtag") == DeviceState::Connected, "JTAG still Connected");
}

int main() {
    std::cout << "========================================\n";
    std::cout << "Running Embedded C++ Unit Tests (Task 11)\n";
    std::cout << "========================================\n";

    test_discovery_three_devices();
    test_domain_specifications();
    test_lifecycle_and_deterministic_telemetry();
    test_fault_lifecycle_and_no_silent_autoconnect();
    test_fault_isolation();

    std::cout << "========================================\n";
    std::cout << "Tests Passed: " << g_passed << "\n";
    std::cout << "Tests Failed: " << g_failed << "\n";
    std::cout << "========================================\n";

    return (g_failed == 0) ? 0 : 1;
}
