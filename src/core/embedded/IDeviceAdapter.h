#pragma once

#include "EmbeddedModels.h"
#include <string>

namespace uew::embedded {

/**
 * Pure abstract interface representing a host-side mock adapter for an embedded device.
 */
class IDeviceAdapter {
public:
    virtual ~IDeviceAdapter() = default;

    virtual std::string get_id() const = 0;
    virtual DeviceInfo get_info() const = 0;
    virtual HardwareCapabilities get_capabilities() const = 0;
    virtual DeviceState get_state() const = 0;

    virtual bool connect() = 0;
    virtual bool disconnect() = 0;
    virtual TelemetryResult get_telemetry() = 0;

    virtual void inject_fault(const std::string& fault_type) = 0;
    virtual void clear_fault() = 0;
};

} // namespace uew::embedded
