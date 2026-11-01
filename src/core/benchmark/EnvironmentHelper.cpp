#include "EnvironmentHelper.h"
#include <thread>
#include <sstream>
#include <cstring>
#include <cstdlib>

#ifdef _WIN32
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#include <intrin.h>
#endif

namespace uew::benchmark {

namespace {

std::string getProcessorBrandString() {
#if defined(_WIN32) && (defined(_M_X64) || defined(_M_IX86))
    int cpuInfo[4] = {0};
    __cpuid(cpuInfo, 0x80000000);
    unsigned int maxExtId = static_cast<unsigned int>(cpuInfo[0]);

    if (maxExtId >= 0x80000004) {
        char brand[65] = {0};
        __cpuid(reinterpret_cast<int*>(brand), 0x80000002);
        __cpuid(reinterpret_cast<int*>(brand + 16), 0x80000003);
        __cpuid(reinterpret_cast<int*>(brand + 32), 0x80000004);

        // Trim leading spaces
        const char* p = brand;
        while (*p == ' ') ++p;
        if (*p != '\0') {
            return std::string(p);
        }
    }
#endif

#if defined(_MSC_VER)
#pragma warning(push)
#pragma warning(disable: 4996)
#endif
    const char* envIdentifier = std::getenv("PROCESSOR_IDENTIFIER");
#if defined(_MSC_VER)
#pragma warning(pop)
#endif
    if (envIdentifier && std::strlen(envIdentifier) > 0) {
        return std::string(envIdentifier);
    }
    return "Unknown x64 Processor";
}

unsigned int getPhysicalCoreCount() {
#ifdef _WIN32
    DWORD length = 0;
    GetLogicalProcessorInformationEx(RelationProcessorCore, nullptr, &length);
    if (GetLastError() == ERROR_INSUFFICIENT_BUFFER && length > 0) {
        std::vector<char> buffer(length);
        auto* info = reinterpret_cast<PSYSTEM_LOGICAL_PROCESSOR_INFORMATION_EX>(buffer.data());
        if (GetLogicalProcessorInformationEx(RelationProcessorCore, info, &length)) {
            unsigned int cores = 0;
            DWORD offset = 0;
            while (offset < length) {
                auto* current = reinterpret_cast<PSYSTEM_LOGICAL_PROCESSOR_INFORMATION_EX>(buffer.data() + offset);
                if (current->Relationship == RelationProcessorCore) {
                    ++cores;
                }
                offset += current->Size;
            }
            if (cores > 0) return cores;
        }
    }
#endif
    return std::thread::hardware_concurrency();
}

uint64_t getTotalPhysicalRam() {
#ifdef _WIN32
    MEMORYSTATUSEX memInfo;
    memInfo.dwLength = sizeof(MEMORYSTATUSEX);
    if (GlobalMemoryStatusEx(&memInfo)) {
        return memInfo.ullTotalPhys;
    }
#endif
    return 0;
}

std::string getCompilerString() {
    std::ostringstream oss;
#if defined(_MSC_VER)
    oss << "MSVC " << (_MSC_VER / 100) << "." << (_MSC_VER % 100);
#if defined(_MSC_FULL_VER)
    oss << " (Build " << _MSC_FULL_VER << ")";
#endif
#elif defined(__clang__)
    oss << "Clang " << __clang_major__ << "." << __clang_minor__ << "." << __clang_patchlevel__;
#elif defined(__GNUC__)
    oss << "GCC " << __GNUC__ << "." << __GNUC_MINOR__ << "." << __GNUC_PATCHLEVEL__;
#else
    oss << "Standard C++17 Compiler";
#endif
    return oss.str();
}

std::string getBuildModeString() {
    std::ostringstream oss;
#if defined(NDEBUG)
    oss << "Release (/O2)";
#else
    oss << "Debug";
#endif
#if defined(_MSVC_LANG)
    oss << " [C++" << (_MSVC_LANG / 100 % 100) << "]";
#elif defined(__cplusplus)
    oss << " [C++" << (__cplusplus / 100 % 100) << "]";
#endif
    return oss.str();
}

} // namespace

EnvironmentInfo detectEnvironment() {
    EnvironmentInfo info;
    info.cpu_model = getProcessorBrandString();
    info.logical_cores = std::thread::hardware_concurrency();
    info.physical_cores = getPhysicalCoreCount();
    info.total_ram_bytes = getTotalPhysicalRam();
    info.compiler = getCompilerString();
    info.build_mode = getBuildModeString();
    info.timer_clock = "std::chrono::steady_clock (QPC monotonic)";
    info.timing_scope = "Compute loop; parallel includes thread spawn, execution, and join; excludes workload generation and JSON/IO";
    return info;
}

} // namespace uew::benchmark
