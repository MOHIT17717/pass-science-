#pragma once

#include <string>
#include <vector>
#include <limits>
#include <cstdint>
#include <cmath>

namespace uew::parsers {

constexpr size_t MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
constexpr size_t MAX_STL_TRIANGLES = 50000;
constexpr size_t MAX_CSV_RECORDS = 100000;

struct Vector3D {
    double x{0.0};
    double y{0.0};
    double z{0.0};

    bool is_finite() const {
        return std::isfinite(x) && std::isfinite(y) && std::isfinite(z);
    }

    double length() const {
        return std::sqrt(x * x + y * y + z * z);
    }
};

struct BoundingBox3D {
    Vector3D min{
        std::numeric_limits<double>::max(),
        std::numeric_limits<double>::max(),
        std::numeric_limits<double>::max()
    };
    Vector3D max{
        std::numeric_limits<double>::lowest(),
        std::numeric_limits<double>::lowest(),
        std::numeric_limits<double>::lowest()
    };

    bool is_valid() const {
        return min.x <= max.x && min.y <= max.y && min.z <= max.z;
    }

    void expand(const Vector3D& p) {
        if (p.x < min.x) min.x = p.x;
        if (p.y < min.y) min.y = p.y;
        if (p.z < min.z) min.z = p.z;
        if (p.x > max.x) max.x = p.x;
        if (p.y > max.y) max.y = p.y;
        if (p.z > max.z) max.z = p.z;
    }
};

struct Triangle3D {
    Vector3D normal;
    Vector3D v1;
    Vector3D v2;
    Vector3D v3;
    bool normal_recomputed{false};
};

struct StlModel {
    std::string solid_name{"solid"};
    std::vector<Triangle3D> triangles;
    BoundingBox3D bbox;
    size_t triangle_count{0};
    bool is_valid{false};
};

struct TemperatureNode {
    int64_t node_id{0};
    double x_m{0.0};
    double y_m{0.0};
    double z_m{0.0};
    double temperature_C{0.0};

    bool is_finite() const {
        return std::isfinite(x_m) && std::isfinite(y_m) &&
               std::isfinite(z_m) && std::isfinite(temperature_C);
    }
};

struct TemperatureDataset {
    std::vector<TemperatureNode> nodes;
    BoundingBox3D bbox;
    double min_temperature_C{0.0};
    double max_temperature_C{0.0};
    double avg_temperature_C{0.0};
    size_t node_count{0};
    bool is_synthetic{false};
    std::string provenance{"unspecified"};
    bool is_valid{false};
};

} // namespace uew::parsers
