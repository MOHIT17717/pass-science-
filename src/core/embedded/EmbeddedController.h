#pragma once

#include "IDeviceAdapter.h"
#include <memory>
#include <string>
#include <vector>
#include <unordered_map>
#include <mutex>

namespace uew::embedded {

/**
 * Controller managing the lifecycle, discovery, and fault isolation of simulated embedded devices.
 */
class EmbeddedController {
public:
    EmbeddedController();
    ~EmbeddedController() = default;

    // Discovery & device enumeration
    std::vector<DeviceInfo> get_devices() const;
    std::vector<HardwareCapabilities> get_all_capabilities() const;

    // Device connection management
    bool connect_device(const std::string& id);
    bool disconnect_device(const std::string& id);
    DeviceState get_device_state(const std::string& id) const;

    // Telemetry acquisition
    TelemetryResult get_device_telemetry(const std::string& id);
    std::vector<TelemetryResult> get_all_telemetry();

    // Fault injection & isolated recovery
    bool inject_fault(const std::string& id, const std::string& fault_type);
    bool clear_fault(const std::string& id);

    // Lifecycle reset
    void reset_all();

private:
    IDeviceAdapter* find_adapter_locked(const std::string& id) const;

    mutable std::mutex mutex_;
    std::vector<std::unique_ptr<IDeviceAdapter>> adapters_;
    std::unordered_map<std::string, IDeviceAdapter*> adapter_map_;
};

} // namespace uew::embedded
