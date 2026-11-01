#pragma once

#include "IDeviceAdapter.h"
#include <string>

namespace uew::embedded {

class MockMcuAdapter : public IDeviceAdapter {
public:
    MockMcuAdapter();
    ~MockMcuAdapter() override = default;

    std::string get_id() const override { return "mcu"; }
    DeviceInfo get_info() const override;
    HardwareCapabilities get_capabilities() const override;
    DeviceState get_state() const override { return state_; }

    bool connect() override;
    bool disconnect() override;
    TelemetryResult get_telemetry() override;

    void inject_fault(const std::string& fault_type) override;
    void clear_fault() override;

private:
    DeviceState state_ = DeviceState::Disconnected;
    DeviceState pre_fault_state_ = DeviceState::Disconnected;
    bool faulted_ = false;
    std::string fault_type_;
};

} // namespace uew::embedded
