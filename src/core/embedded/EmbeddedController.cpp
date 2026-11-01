#include "EmbeddedController.h"
#include "MockMcuAdapter.h"
#include "MockFpgaAdapter.h"
#include "MockJtagAdapter.h"

namespace uew::embedded {

EmbeddedController::EmbeddedController() {
    auto mcu = std::make_unique<MockMcuAdapter>();
    auto fpga = std::make_unique<MockFpgaAdapter>();
    auto jtag = std::make_unique<MockJtagAdapter>();

    adapter_map_[mcu->get_id()] = mcu.get();
    adapter_map_[fpga->get_id()] = fpga.get();
    adapter_map_[jtag->get_id()] = jtag.get();

    adapters_.push_back(std::move(mcu));
    adapters_.push_back(std::move(fpga));
    adapters_.push_back(std::move(jtag));
}

IDeviceAdapter* EmbeddedController::find_adapter_locked(const std::string& id) const {
    auto it = adapter_map_.find(id);
    if (it != adapter_map_.end()) {
        return it->second;
    }
    return nullptr;
}

std::vector<DeviceInfo> EmbeddedController::get_devices() const {
    std::lock_guard<std::mutex> lock(mutex_);
    std::vector<DeviceInfo> list;
    list.reserve(adapters_.size());
    for (const auto& a : adapters_) {
        list.push_back(a->get_info());
    }
    return list;
}

std::vector<HardwareCapabilities> EmbeddedController::get_all_capabilities() const {
    std::lock_guard<std::mutex> lock(mutex_);
    std::vector<HardwareCapabilities> list;
    list.reserve(adapters_.size());
    for (const auto& a : adapters_) {
        list.push_back(a->get_capabilities());
    }
    return list;
}

bool EmbeddedController::connect_device(const std::string& id) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto* adapter = find_adapter_locked(id);
    if (!adapter) return false;
    return adapter->connect();
}

bool EmbeddedController::disconnect_device(const std::string& id) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto* adapter = find_adapter_locked(id);
    if (!adapter) return false;
    return adapter->disconnect();
}

DeviceState EmbeddedController::get_device_state(const std::string& id) const {
    std::lock_guard<std::mutex> lock(mutex_);
    auto* adapter = find_adapter_locked(id);
    if (!adapter) return DeviceState::Disconnected;
    return adapter->get_state();
}

TelemetryResult EmbeddedController::get_device_telemetry(const std::string& id) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto* adapter = find_adapter_locked(id);
    if (!adapter) {
        TelemetryResult res;
        res.success = false;
        res.error_code = "DEVICE_NOT_FOUND";
        res.error_message = "Device ID '" + id + "' not found in embedded controller.";
        res.recoverable = false;
        return res;
    }
    return adapter->get_telemetry();
}

std::vector<TelemetryResult> EmbeddedController::get_all_telemetry() {
    std::lock_guard<std::mutex> lock(mutex_);
    std::vector<TelemetryResult> results;
    results.reserve(adapters_.size());
    for (const auto& a : adapters_) {
        results.push_back(a->get_telemetry());
    }
    return results;
}

bool EmbeddedController::inject_fault(const std::string& id, const std::string& fault_type) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto* adapter = find_adapter_locked(id);
    if (!adapter) return false;
    adapter->inject_fault(fault_type);
    return true;
}

bool EmbeddedController::clear_fault(const std::string& id) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto* adapter = find_adapter_locked(id);
    if (!adapter) return false;
    adapter->clear_fault();
    return true;
}

void EmbeddedController::reset_all() {
    std::lock_guard<std::mutex> lock(mutex_);
    for (auto& a : adapters_) {
        a->clear_fault();
        a->disconnect();
    }
}

} // namespace uew::embedded
