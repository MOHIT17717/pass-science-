#include "MainWindow.h"
#include "core/thermal/FEMSolver.h"
#include <QTabWidget>
#include <QWidget>
#include <QVBoxLayout>
#include <QLabel>
#include <QPushButton>
#include <QTextEdit>
#include <QStatusBar>
#include <QString>

MainWindow::MainWindow(QWidget* parent) : QMainWindow(parent),
    tabs_(new QTabWidget(this)), status_(new QLabel("Ready")) {
    setWindowTitle("Unified Engineering Workbench");
    resize(1100, 720);
    setCentralWidget(tabs_);
    statusBar()->addWidget(status_);
    buildDashboard();
}

void MainWindow::buildDashboard() {
    const QStringList names = {"Dashboard", "Geometry", "Thermal Analysis",
                               "Performance", "Hardware", "Backpropagation"};
    for (const auto& name : names) {
        auto* page = new QWidget;
        auto* layout = new QVBoxLayout(page);
        auto* heading = new QLabel("<h2>" + name + "</h2>");
        layout->addWidget(heading);
        if (name == "Thermal Analysis") {
            auto* description = new QLabel(
                "Steady-state 1D two-node linear thermal FEM solver.");
            auto* run = new QPushButton("Run reference thermal solve");
            auto* output = new QTextEdit;
            output->setReadOnly(true);
            layout->addWidget(description);
            layout->addWidget(run);
            layout->addWidget(output);
            connect(run, &QPushButton::clicked, this, [this, output]() {
                try {
                    uew::thermal::ThermalProblem p;
                    p.elements = 40;
                    const auto r = uew::thermal::solveSteady1DRod(p);
                    QString text;
                    text += QString("Elements: %1\\nMaximum midpoint error: %2 °C\\n\\n")
                        .arg(p.elements).arg(r.max_midpoint_error_C, 0, 'g', 12);
                    text += "x (m), temperature (°C)\\n";
                    for (std::size_t i = 0; i < r.x_m.size(); ++i)
                        text += QString::number(r.x_m[i], 'f', 6) + ", " +
                                QString::number(r.temperature_C[i], 'f', 8) + "\\n";
                    output->setPlainText(text);
                    status_->setText("Thermal solve completed.");
                } catch (const std::exception& ex) {
                    output->setPlainText(QString("Error: ") + ex.what());
                    status_->setText("Thermal solve failed.");
                }
            });
        } else {
            layout->addWidget(new QLabel(
                "Module scaffold created. Implementation is scheduled in the next development milestones."));
            layout->addStretch();
        }
        tabs_->addTab(page, name);
    }
}
