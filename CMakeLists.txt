cmake_minimum_required(VERSION 3.20)
project(UnifiedEngineeringWorkbench VERSION 0.1.0 LANGUAGES CXX)

# Enforce C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Build options
include(CTest)
option(UEW_BUILD_TESTS "Build the standalone core test executable" ON)

# ---------------------------------------------------------------------------
# Core engineering library (Independent of UI, Qt, Electron, and transport)
# ---------------------------------------------------------------------------
add_library(uew_core
    src/core/thermal/FEMSolver.cpp
    src/core/thermal/FEMSolver.h
    src/core/thermal/ThermalModels.h
    src/core/thermal/ThermalVerification.h
    src/core/thermal/ThermalVerification.cpp
    src/core/parsers/ParserModels.h
    src/core/parsers/StlParser.h
    src/core/parsers/StlParser.cpp
    src/core/parsers/CsvParser.h
    src/core/parsers/CsvParser.cpp
)

target_include_directories(uew_core PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/src)

if(MSVC)
    target_compile_options(uew_core PRIVATE /W4 /permissive-)
else()
    target_compile_options(uew_core PRIVATE -Wall -Wextra -Wpedantic)
endif()

# ---------------------------------------------------------------------------
# Core test harness
# ---------------------------------------------------------------------------
if(BUILD_TESTING AND UEW_BUILD_TESTS)
    add_executable(uew_core_tests
        tests/test_fem.cpp
    )
    target_link_libraries(uew_core_tests PRIVATE uew_core)
    add_test(NAME uew_core_tests COMMAND uew_core_tests)

    add_executable(uew_thermal_tests
        tests/test_thermal_verification.cpp
    )
    target_link_libraries(uew_thermal_tests PRIVATE uew_core)
    add_test(NAME uew_thermal_tests COMMAND uew_thermal_tests)

    add_executable(uew_parser_tests
        tests/test_parsers.cpp
    )
    target_link_libraries(uew_parser_tests PRIVATE uew_core)
    add_test(NAME uew_parser_tests COMMAND uew_parser_tests)
    set_tests_properties(uew_parser_tests PROPERTIES WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}")
endif()

# ---------------------------------------------------------------------------
# API Transport Adapter library (Loopback HTTP & JSON DTOs)
# ---------------------------------------------------------------------------
add_library(uew_api
    src/api/Json.h
    src/api/Json.cpp
    src/api/HttpServer.h
    src/api/HttpServer.cpp
    src/api/ApiRouter.h
    src/api/ApiRouter.cpp
)

target_include_directories(uew_api PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/src)
target_link_libraries(uew_api PUBLIC uew_core)

if(WIN32)
    target_link_libraries(uew_api PUBLIC ws2_32)
endif()

if(MSVC)
    target_compile_options(uew_api PRIVATE /W4 /permissive-)
else()
    target_compile_options(uew_api PRIVATE -Wall -Wextra -Wpedantic)
endif()

# ---------------------------------------------------------------------------
# Standalone Backend Executable
# ---------------------------------------------------------------------------
add_executable(uew_backend
    src/main_backend.cpp
)

target_link_libraries(uew_backend PRIVATE uew_api uew_core)

if(WIN32)
    target_link_libraries(uew_backend PRIVATE ws2_32)
endif()

if(MSVC)
    target_compile_options(uew_backend PRIVATE /W4 /permissive-)
endif()

# ---------------------------------------------------------------------------
# API & Integration test harness
# ---------------------------------------------------------------------------
if(BUILD_TESTING AND UEW_BUILD_TESTS)
    add_executable(uew_api_tests
        tests/test_api.cpp
    )
    target_link_libraries(uew_api_tests PRIVATE uew_api uew_core)
    if(WIN32)
        target_link_libraries(uew_api_tests PRIVATE ws2_32)
    endif()
    add_test(NAME uew_api_tests COMMAND uew_api_tests)
endif()
