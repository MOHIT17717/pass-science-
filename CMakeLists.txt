cmake_minimum_required(VERSION 3.20)
project(UnifiedEngineeringWorkbench VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

option(UEW_BUILD_GUI "Build the Qt 6 desktop application when Qt is available" ON)
option(UEW_BUILD_TESTS "Build the standalone core tests" ON)

add_library(uew_core
    src/core/thermal/FEMSolver.cpp
)
target_include_directories(uew_core PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/src)
if(MSVC)
    target_compile_options(uew_core PRIVATE /W4 /permissive-)
else()
    target_compile_options(uew_core PRIVATE -Wall -Wextra -Wpedantic)
endif()

if(UEW_BUILD_GUI)
    find_package(Qt6 QUIET COMPONENTS Widgets)
    if(Qt6_FOUND)
        qt_standard_project_setup()
        qt_add_executable(UnifiedEngineeringWorkbench
            src/main.cpp
            src/ui/MainWindow.cpp
            src/ui/MainWindow.h
        )
        target_link_libraries(UnifiedEngineeringWorkbench PRIVATE uew_core Qt6::Widgets)
        set_target_properties(UnifiedEngineeringWorkbench PROPERTIES
            WIN32_EXECUTABLE TRUE
        )
    else()
        message(WARNING "Qt 6 Widgets not found. GUI target will be skipped; core and tests can still build.")
    endif()
endif()

if(UEW_BUILD_TESTS)
    enable_testing()
    add_executable(uew_core_tests tests/test_fem.cpp)
    target_link_libraries(uew_core_tests PRIVATE uew_core)
    add_test(NAME uew_core_tests COMMAND uew_core_tests)
endif()
