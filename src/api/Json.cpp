#include "Json.h"
#include <cctype>
#include <iomanip>

namespace uew::api {

Json::Json() : m_type(JsonType::Null) {}
Json::Json(std::nullptr_t) : m_type(JsonType::Null) {}
Json::Json(bool value) : m_type(JsonType::Boolean), m_bool_val(value) {}
Json::Json(int value) : m_type(JsonType::Number), m_num_val(static_cast<double>(value)) {}
Json::Json(int64_t value) : m_type(JsonType::Number), m_num_val(static_cast<double>(value)) {}
Json::Json(double value) : m_type(JsonType::Number), m_num_val(value) {}
Json::Json(const char* value) : m_type(JsonType::String), m_str_val(value ? value : "") {}
Json::Json(const std::string& value) : m_type(JsonType::String), m_str_val(value) {}
Json::Json(const std::vector<Json>& value) : m_type(JsonType::Array), m_arr_val(value) {}
Json::Json(const std::map<std::string, Json>& value) : m_type(JsonType::Object), m_obj_val(value) {}

JsonType Json::type() const { return m_type; }
bool Json::is_null() const { return m_type == JsonType::Null; }
bool Json::is_bool() const { return m_type == JsonType::Boolean; }
bool Json::is_number() const { return m_type == JsonType::Number; }
bool Json::is_string() const { return m_type == JsonType::String; }
bool Json::is_array() const { return m_type == JsonType::Array; }
bool Json::is_object() const { return m_type == JsonType::Object; }

bool Json::as_bool() const { return m_bool_val; }
double Json::as_number() const { return m_num_val; }
int64_t Json::as_int() const { return static_cast<int64_t>(m_num_val); }
const std::string& Json::as_string() const { return m_str_val; }
const std::vector<Json>& Json::as_array() const { return m_arr_val; }
const std::map<std::string, Json>& Json::as_object() const { return m_obj_val; }

Json& Json::operator[](const std::string& key) {
    if (m_type != JsonType::Object) {
        m_type = JsonType::Object;
        m_obj_val.clear();
    }
    return m_obj_val[key];
}

const Json& Json::operator[](const std::string& key) const {
    static const Json s_null;
    if (m_type != JsonType::Object) return s_null;
    auto it = m_obj_val.find(key);
    return (it != m_obj_val.end()) ? it->second : s_null;
}

Json& Json::operator[](size_t index) {
    if (m_type != JsonType::Array) {
        m_type = JsonType::Array;
        m_arr_val.clear();
    }
    if (index >= m_arr_val.size()) {
        m_arr_val.resize(index + 1);
    }
    return m_arr_val[index];
}

const Json& Json::operator[](size_t index) const {
    static const Json s_null;
    if (m_type != JsonType::Array || index >= m_arr_val.size()) return s_null;
    return m_arr_val[index];
}

bool Json::contains(const std::string& key) const {
    return (m_type == JsonType::Object) && (m_obj_val.find(key) != m_obj_val.end());
}

size_t Json::size() const {
    if (m_type == JsonType::Array) return m_arr_val.size();
    if (m_type == JsonType::Object) return m_obj_val.size();
    return 0;
}

void Json::escape_string(const std::string& in, std::ostream& out) {
    out << '"';
    for (char c : in) {
        switch (c) {
            case '"': out << "\\\""; break;
            case '\\': out << "\\\\"; break;
            case '\b': out << "\\b"; break;
            case '\f': out << "\\f"; break;
            case '\n': out << "\\n"; break;
            case '\r': out << "\\r"; break;
            case '\t': out << "\\t"; break;
            default:
                if (static_cast<unsigned char>(c) < 0x20) {
                    out << "\\u" << std::hex << std::setw(4) << std::setfill('0') << static_cast<int>(c);
                } else {
                    out << c;
                }
                break;
        }
    }
    out << '"';
}

std::string Json::serialize() const {
    std::ostringstream ss;
    switch (m_type) {
        case JsonType::Null:
            ss << "null";
            break;
        case JsonType::Boolean:
            ss << (m_bool_val ? "true" : "false");
            break;
        case JsonType::Number: {
            int64_t i = static_cast<int64_t>(m_num_val);
            if (static_cast<double>(i) == m_num_val) {
                ss << i;
            } else {
                ss << std::setprecision(14) << m_num_val;
            }
            break;
        }
        case JsonType::String:
            escape_string(m_str_val, ss);
            break;
        case JsonType::Array: {
            ss << '[';
            for (size_t i = 0; i < m_arr_val.size(); ++i) {
                if (i > 0) ss << ',';
                ss << m_arr_val[i].serialize();
            }
            ss << ']';
            break;
        }
        case JsonType::Object: {
            ss << '{';
            bool first = true;
            // std::map automatically provides sorted deterministic keys
            for (const auto& [k, v] : m_obj_val) {
                if (!first) ss << ',';
                first = false;
                escape_string(k, ss);
                ss << ':';
                ss << v.serialize();
            }
            ss << '}';
            break;
        }
    }
    return ss.str();
}

namespace {
class Parser {
    const std::string& src;
    size_t pos{0};

    void skip_whitespace() {
        while (pos < src.size() && (src[pos] == ' ' || src[pos] == '\t' || src[pos] == '\r' || src[pos] == '\n')) {
            ++pos;
        }
    }

    char peek() {
        skip_whitespace();
        return (pos < src.size()) ? src[pos] : '\0';
    }

    char get() {
        skip_whitespace();
        return (pos < src.size()) ? src[pos++] : '\0';
    }

public:
    explicit Parser(const std::string& s) : src(s) {}

    Json parse_value() {
        char c = peek();
        if (c == '{') return parse_object();
        if (c == '[') return parse_array();
        if (c == '"') return parse_string();
        if (c == 't' || c == 'f') return parse_bool();
        if (c == 'n') return parse_null();
        if (c == '-' || std::isdigit(static_cast<unsigned char>(c))) return parse_number();
        throw std::runtime_error("Unexpected character in JSON: " + std::string(1, c));
    }

    Json parse_object() {
        get(); // consume '{'
        std::map<std::string, Json> obj;
        if (peek() == '}') {
            get();
            return Json(obj);
        }
        while (pos < src.size()) {
            Json key = parse_string();
            if (get() != ':') throw std::runtime_error("Expected ':' after object key");
            Json val = parse_value();
            obj[key.as_string()] = val;
            char next = get();
            if (next == '}') break;
            if (next != ',') throw std::runtime_error("Expected ',' or '}' in object");
        }
        return Json(obj);
    }

    Json parse_array() {
        get(); // consume '['
        std::vector<Json> arr;
        if (peek() == ']') {
            get();
            return Json(arr);
        }
        while (pos < src.size()) {
            arr.push_back(parse_value());
            char next = get();
            if (next == ']') break;
            if (next != ',') throw std::runtime_error("Expected ',' or ']' in array");
        }
        return Json(arr);
    }

    Json parse_string() {
        get(); // consume '"'
        std::string s;
        while (pos < src.size()) {
            char c = src[pos++];
            if (c == '"') return Json(s);
            if (c == '\\' && pos < src.size()) {
                char esc = src[pos++];
                switch (esc) {
                    case '"': s += '"'; break;
                    case '\\': s += '\\'; break;
                    case '/': s += '/'; break;
                    case 'b': s += '\b'; break;
                    case 'f': s += '\f'; break;
                    case 'n': s += '\n'; break;
                    case 'r': s += '\r'; break;
                    case 't': s += '\t'; break;
                    default: s += esc; break;
                }
            } else {
                s += c;
            }
        }
        throw std::runtime_error("Unterminated string in JSON");
    }

    Json parse_bool() {
        if (src.compare(pos, 4, "true") == 0) { pos += 4; return Json(true); }
        if (src.compare(pos, 5, "false") == 0) { pos += 5; return Json(false); }
        throw std::runtime_error("Invalid boolean literal in JSON");
    }

    Json parse_null() {
        if (src.compare(pos, 4, "null") == 0) { pos += 4; return Json(nullptr); }
        throw std::runtime_error("Invalid null literal in JSON");
    }

    Json parse_number() {
        size_t start = pos;
        if (src[pos] == '-') ++pos;
        while (pos < src.size() && std::isdigit(static_cast<unsigned char>(src[pos]))) ++pos;
        if (pos < src.size() && src[pos] == '.') {
            ++pos;
            while (pos < src.size() && std::isdigit(static_cast<unsigned char>(src[pos]))) ++pos;
        }
        if (pos < src.size() && (src[pos] == 'e' || src[pos] == 'E')) {
            ++pos;
            if (pos < src.size() && (src[pos] == '+' || src[pos] == '-')) ++pos;
            while (pos < src.size() && std::isdigit(static_cast<unsigned char>(src[pos]))) ++pos;
        }
        double val = std::stod(src.substr(start, pos - start));
        return Json(val);
    }
};
} // namespace

Json Json::parse(const std::string& json_str) {
    Parser parser(json_str);
    return parser.parse_value();
}

} // namespace uew::api

