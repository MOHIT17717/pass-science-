#pragma once
#include <QMainWindow>

class QTabWidget;
class QLabel;

class MainWindow final : public QMainWindow {
    Q_OBJECT
public:
    explicit MainWindow(QWidget* parent = nullptr);
private:
    QTabWidget* tabs_;
    QLabel* status_;
    void buildDashboard();
    void runThermalDemo();
};
