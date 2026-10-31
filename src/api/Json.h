#pragma once

#include <string>
#include <vector>
#include <map>
#include <memory>
#include <sstream>
#include <stdexcept>
#include <cstdint>

namespace uew::api {

enum class JsonType {
    Null,
    Boolean,
    Number,
    String,
    Array,
    Object
};

/**
 * Clean, lightweight, self-contained JSON value representation for C++17.
 * Provides deterministic serialization (alphabetical keys via std::map) and parsing.
 */
class Json {
public:
    Json();
    Json(std::nullptr_t);
    Json(bool value);
    Json(int value);
    Json(int64_t value);
    Json(double value);
    Json(const char* value);
    Json(const std::string& value);
    Json(const std::vector<Json>& value);
    Json(const std::map<std::string, Json>& value);

    JsonType type() const;

    bool is_null() const;
    bool is_bool() const;
    bool is_number() const;
    bool is_string() const;
    bool is_array() const;
    bool is_object() const;

    bool as_bool() const;
    double as_number() const;
    int64_t as_int() const;
    const std::string& as_string() const;
    const std::vector<Json>& as_array() const;
    const std::map<std::string, Json>& as_object() const;

    // Mutators & accessors
    Json& operator[](const std::string& key);
    const Json& operator[](const std::string& key) const;
    Json& operator[](size_t index);
    const Json& operator[](size_t index) const;

    bool contains(const std::string& key) const;
    size_t size() const;

    // Serialization & Parsing
    std::string serialize() const;
    static Json parse(const std::string& json_str);

private:
    JsonType m_type{JsonType::Null};
    bool m_bool_val{false};
    double m_num_val{0.0};
    std::string m_str_val;
    std::vector<Json> m_arr_val;
    std::map<std::string, Json> m_obj_val;

    static void escape_string(const std::string& in, std::ostream& out);
};

} // namespace uew::api

