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
endif()
