import 'package:flutter/material.dart';
import 'package:hive/hive.dart';

class ThemeProvider with ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.dark;
  final String _themeKey = 'themeMode';
  late Box<int> _settingsBox;

  ThemeProvider() {
    _initTheme();
  }

  ThemeMode get themeMode => _themeMode;
  bool get isDarkMode => _themeMode == ThemeMode.dark;

  Future<void> _initTheme() async {
    _settingsBox = await Hive.openBox<int>('settings');
    final storedTheme = _settingsBox.get(_themeKey);
    if (storedTheme != null) {
      _themeMode = ThemeMode.values[storedTheme];
    }
    notifyListeners();
  }

  void toggleTheme(bool isDark) {
    _themeMode = isDark ? ThemeMode.dark : ThemeMode.light;
    _settingsBox.put(_themeKey, _themeMode.index);
    notifyListeners();
  }
}

